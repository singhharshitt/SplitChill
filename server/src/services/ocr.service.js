/**
 * OCR Service — OCRSpace (cloud) with Tesseract.js (local fallback).
 * Extracts receipt data: merchant, total, date, items.
 */
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

const OCRSPACE_URL = "https://api.ocr.space/parse/image";

function getOcrSpaceKey() {
  return process.env.OCRSPACE_API_KEY || process.env.OCRSPACE;
}

/**
 * Run OCR on an image file. Tries OCRSpace first, then Tesseract.js.
 * @param {string} filePath — absolute path to image
 * @returns {Promise<{rawText: string, provider: string, fields: object}>}
 */
async function extractText(filePath) {
  const ocrKey = getOcrSpaceKey();

  // ── Try OCRSpace (cloud) first ──
  if (ocrKey) {
    try {
      const result = await ocrSpaceExtract(filePath, ocrKey);
      if (result.rawText) return result;
    } catch (err) {
      logger.warn("ocrspace_failed", { error: err.message });
    }
  }

  // ── Fallback: Tesseract.js (local) ──
  try {
    const result = await tesseractExtract(filePath);
    return result;
  } catch (err) {
    logger.warn("tesseract_failed", { error: err.message });
    return { rawText: "", provider: "none", fields: {}, confidence: 0, error: "OCR extraction failed" };
  }
}

async function ocrSpaceExtract(filePath, apiKey) {
  const FormData = (await import("formdata-node")).FormData;
  const { fileFromPath } = await import("formdata-node/file-from-path");

  const form = new FormData();
  form.set("file", await fileFromPath(filePath));
  form.set("apikey", apiKey);
  form.set("language", "eng");
  form.set("isOverlayRequired", "false");
  form.set("detectOrientation", "true");
  form.set("scale", "true");
  form.set("OCREngine", "2");

  const res = await fetch(OCRSPACE_URL, { method: "POST", body: form });
  if (!res.ok) throw new Error(`OCRSpace HTTP ${res.status}`);

  const data = await res.json();
  if (data.IsErroredOnProcessing) {
    throw new Error(data.ErrorMessage?.[0] || "OCRSpace processing error");
  }

  const rawText = (data.ParsedResults || []).map((r) => r.ParsedText).join("\n").trim();
  const confidence = data.ParsedResults?.[0]?.TextOverlay?.confidence || 0;

  return {
    rawText,
    provider: "ocrspace",
    confidence: Math.round(confidence * 100) / 100,
    fields: parseReceiptFields(rawText),
  };
}

async function tesseractExtract(filePath) {
  let Tesseract;
  try {
    Tesseract = require("tesseract.js");
  } catch {
    throw new Error("tesseract.js is not installed");
  }

  const { data } = await Tesseract.recognize(filePath, "eng", {
    logger: () => {},
  });

  const rawText = (data.text || "").trim();
  return {
    rawText,
    provider: "tesseract",
    confidence: Math.round((data.confidence || 0)) / 100,
    fields: parseReceiptFields(rawText),
  };
}

/**
 * Parse common receipt fields from raw OCR text.
 * Best-effort extraction — returns what it can find.
 */
function parseReceiptFields(text) {
  if (!text) return {};

  const fields = {};

  // Total — look for patterns like "Total: 1,234.56" or "TOTAL 123.45"
  const totalMatch = text.match(/(?:total|grand\s*total|amount\s*due|net\s*amount)[:\s]*[₹$]?\s*([\d,]+\.?\d*)/i);
  if (totalMatch) fields.total = parseFloat(totalMatch[1].replace(/,/g, ""));

  // Date — look for common date formats
  const dateMatch = text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
  if (dateMatch) fields.date = dateMatch[1];

  // Merchant — usually the first non-empty line
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    fields.merchant = lines[0].slice(0, 100);
  }

  // Items — lines that look like "ItemName  123.45"
  const itemPattern = /^(.{3,40})\s+([\d,]+\.?\d{0,2})\s*$/;
  const items = [];
  for (const line of lines) {
    const match = line.match(itemPattern);
    if (match && !line.match(/total|tax|subtotal|discount/i)) {
      items.push({
        name: match[1].trim(),
        amount: parseFloat(match[2].replace(/,/g, "")),
      });
    }
  }
  if (items.length) fields.items = items;

  return fields;
}

/**
 * Validate uploaded file for OCR processing.
 */
function validateReceiptFile(file) {
  const errors = [];
  if (!file) {
    errors.push("No file uploaded");
    return errors;
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff", "application/pdf"];
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} is not supported. Use JPEG, PNG, WebP, BMP, TIFF, or PDF.`);
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    errors.push("File is too large. Maximum size is 5MB.");
  }

  return errors;
}

/**
 * Clean up uploaded file after processing.
 */
function cleanupFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // non-critical
  }
}

module.exports = { extractText, validateReceiptFile, cleanupFile, parseReceiptFields };
