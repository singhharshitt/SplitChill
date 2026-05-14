/**
 * OCR Service — OCRSpace (cloud) with Tesseract.js (local fallback).
 * Extracts receipt data: merchant, total, date, items.
 */
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

const OCRSPACE_URL = "https://api.ocr.space/parse/image";

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

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
    return { rawText: "", provider: "none", fields: {}, confidence: 0, receiptDetected: false, detection: null, error: "OCR extraction failed" };
  }
}

async function ocrSpaceExtract(filePath, apiKey) {
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase().replace(".", "") || "jpg";
  const mimeMap = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", bmp: "image/bmp", tiff: "image/tiff", pdf: "application/pdf" };
  const mime = mimeMap[ext] || "image/jpeg";
  const base64 = `data:${mime};base64,${fileBuffer.toString("base64")}`;

  const body = new URLSearchParams({
    apikey: apiKey,
    base64Image: base64,
    language: "eng",
    isOverlayRequired: "false",
    detectOrientation: "true",
    scale: "true",
    OCREngine: "2",
  });

  const res = await fetch(OCRSPACE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`OCRSpace HTTP ${res.status}`);

  const data = await res.json();
  if (data.IsErroredOnProcessing) {
    throw new Error(data.ErrorMessage?.[0] || "OCRSpace processing error");
  }

  const rawText = (data.ParsedResults || []).map((r) => r.ParsedText).join("\n").trim();
  const fields = parseReceiptFields(rawText);
  const detection = analyzeReceiptDetection(rawText, fields, 0.9);

  return {
    rawText,
    provider: "ocrspace",
    confidence: detection.confidence,
    receiptDetected: detection.receiptDetected,
    detection,
    fields,
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
  const fields = parseReceiptFields(rawText);
  const detection = analyzeReceiptDetection(rawText, fields, Math.round((data.confidence || 0)) / 100);
  return {
    rawText,
    provider: "tesseract",
    confidence: detection.confidence,
    receiptDetected: detection.receiptDetected,
    detection,
    fields,
  };
}

/**
 * Parse common receipt fields from raw OCR text.
 * Best-effort extraction — returns what it can find.
 */
function parseReceiptFields(text) {
  if (!text) return {};

  const fields = {};
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  const currencyPattern = /(?:₹|rs\.?|inr|usd|eur|gbp|\$|£|€)?\s*([\d,]+(?:\.\d{1,2})?)/i;
  const isNoiseLine = (line) => /^(?:receipt|invoice|bill|thank you|order summary|tax invoice)$/i.test(line);

  // Total — prefer the last explicit total-like line to avoid subtotal matches.
  const totalLine = [...lines].reverse().find((line) => /\b(?:grand\s*total|amount\s*due|balance\s*due|net\s*amount|total\s*due|total)\b/i.test(line) && !/\bsubtotal\b/i.test(line));
  if (totalLine) {
    const totalMatch = totalLine.match(currencyPattern);
    if (totalMatch) fields.total = parseFloat(totalMatch[1].replace(/,/g, ""));
  }

  // Taxes — common bill patterns.
  const taxLine = lines.find((line) => /\b(?:tax|vat|gst|service\s*charge)\b/i.test(line));
  if (taxLine) {
    const taxMatch = taxLine.match(currencyPattern);
    if (taxMatch) fields.tax = parseFloat(taxMatch[1].replace(/,/g, ""));
  }

  // Date — look for common date formats
  const dateMatch = text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}(?:\s+\d{1,2}:\d{2}(?:\s*[AP]M)?)?)/i);
  if (dateMatch) fields.date = dateMatch[1];

  // Merchant — prefer the first meaningful business-like line.
  const merchantLine = lines.find((line) => /[A-Za-z]/.test(line) && !isNoiseLine(line) && !/\b(?:item|qty|price|tax|total|subtotal|discount|change)\b/i.test(line));
  if (merchantLine) {
    fields.merchant = merchantLine.slice(0, 100);
  }

  // Items — lines that look like "ItemName  123.45"
  const itemPattern = /^(.{3,60}?)\s+([\d,]+(?:\.\d{1,2})?)\s*$/;
  const items = [];
  for (const line of lines) {
    const match = line.match(itemPattern);
    if (match && !line.match(/total|tax|subtotal|discount|change|vat|gst/i)) {
      items.push({
        name: match[1].trim(),
        amount: parseFloat(match[2].replace(/,/g, "")),
      });
    }
  }
  if (items.length) fields.items = items;

  return fields;
}

function analyzeReceiptDetection(rawText, fields, providerConfidence = 0) {
  const text = String(rawText || "");
  const normalized = text.toLowerCase();
  const hasReceiptKeywords = /\b(receipt|invoice|bill|subtotal|grand total|amount due|balance due|vat|gst|service charge|order summary|thank you)\b/i.test(text);
  const hasMoneySignals = /[₹$£€]\s*\d|\d[\d,]*\.\d{1,2}/.test(text);
  const hasMerchant = Boolean(fields.merchant && !/^(?:receipt|invoice|bill)$/i.test(fields.merchant));
  const hasTotal = Number.isFinite(fields.total) && fields.total > 0;
  const hasTax = Number.isFinite(fields.tax) && fields.tax >= 0;
  const hasItems = Array.isArray(fields.items) && fields.items.length > 0;
  const hasDate = Boolean(fields.date);

  const signalCount = [hasReceiptKeywords, hasMoneySignals, hasMerchant, hasTotal, hasTax, hasItems, hasDate].filter(Boolean).length;
  const confidence = clamp((providerConfidence * 0.55) + ((signalCount / 7) * 0.45), 0, 1);
  const receiptDetected = Boolean(
    (hasTotal && (hasMerchant || hasItems || hasReceiptKeywords || hasTax || hasDate)) ||
    (hasReceiptKeywords && (hasMoneySignals || hasItems || hasTotal)) ||
    (confidence >= 0.55 && (hasTotal || hasItems || hasMerchant))
  );

  return {
    confidence: Math.round(confidence * 100) / 100,
    receiptDetected,
    signals: {
      hasReceiptKeywords,
      hasMoneySignals,
      hasMerchant,
      hasTotal,
      hasTax,
      hasItems,
      hasDate,
    },
    normalizedText: normalized,
  };
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
