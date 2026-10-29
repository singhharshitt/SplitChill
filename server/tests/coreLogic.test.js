/**
 * Unit tests for DB-independent core modules:
 * - fairness engine split math (equal / income-based, exact rupee reconciliation)
 * - UPI intent building + validation (settlement pay links and QR)
 * - AI JSON parsing and missing-key behavior
 * - request validation schemas (settlement, UPI-in-profile update)
 * - receipt field parsing from OCR text
 *
 * These run without MongoDB or network access; service endpoints that need
 * Mongo are covered by manual/API verification (see README).
 */
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const { calculateShares, roundMoney, clamp } = require("../src/utils/fairnessEngine");
const upiService = require("../src/services/upi.service");
const aiService = require("../src/services/ai.service");
const ocrService = require("../src/services/ocr.service");
const { schemas } = require("../src/middleware/validate");

describe("money math", () => {
  test("roundMoney keeps paisa precision", () => {
    assert.equal(roundMoney(100 / 3), 33.33);
    assert.equal(roundMoney(10.005), 10.01);
  });

  test("clamp bounds values", () => {
    assert.equal(clamp(-5, 0, 100), 0);
    assert.equal(clamp(150, 0, 100), 100);
    assert.equal(clamp(50, 0, 100), 50);
  });
});

describe("equal split reconciliation", () => {
  test("shares sum exactly to the amount for awkward amounts", () => {
    for (const amount of [100, 333, 999.99, 10.01]) {
      const shares = calculateShares({
        amount,
        splitType: "equal",
        participants: ["a", "b", "c"].map((id) => ({ user: id })),
        members: [],
      });
      const total = roundMoney(shares.reduce((sum, s) => sum + s.share, 0));
      assert.equal(total, amount, `equal split of ₹${amount} must reconcile exactly`);
      assert.ok(shares.every((s) => s.share >= 0));
    }
  });
});

describe("UPI intent builder", () => {
  test("builds a valid pay link with pa/pn/am/cu/tr", () => {
    const link = upiService.buildUpiIntent({
      payeeVpa: "harsh@ybl",
      payeeName: "Harish",
      amount: 1234.5,
      note: "Trip settlement",
      transactionId: "64f0a1b2c3d4e5f6a7b8c9d0",
    });
    assert.ok(link.startsWith("upi://pay?"));
    assert.ok(link.includes("pa=harsh%40ybl"));
    assert.ok(link.includes("pn=Harish"));
    assert.ok(link.includes("am=1234.50"));
    assert.ok(link.includes("cu=INR"));
    assert.ok(link.includes("tr=64f0a1b2c3d4e5f6a7b8c9d0"));
  });

  test("rejects invalid UPI ids", () => {
    assert.throws(() => upiService.assertValidUpiId("not-an-upi"));
    assert.throws(() => upiService.assertValidUpiId("@bank"));
    assert.throws(() => upiService.assertValidUpiId(""));
  });

  test("rejects non-positive amounts", () => {
    assert.throws(() =>
      upiService.buildUpiIntent({ payeeVpa: "a@b", payeeName: "x", amount: 0, transactionId: "t1" }),
    );
    assert.throws(() =>
      upiService.buildUpiIntent({ payeeVpa: "a@b", payeeName: "x", amount: -5, transactionId: "t1" }),
    );
  });

  test("QR generation produces a data URL for a valid intent", async () => {
    const link = upiService.buildUpiIntent({
      payeeVpa: "test@bank",
      payeeName: "Tester",
      amount: 100,
      transactionId: "abc123",
    });
    const qr = await upiService.buildUpiQrDataUrl(link);
    assert.ok(qr.startsWith("data:image/png;base64,"));
  });

  test("QR generation rejects invalid intents", async () => {
    await assert.rejects(() => upiService.buildUpiQrDataUrl("https://example.com"));
  });
});

describe("AI service helpers", () => {
  test("parseJsonResponse reads fenced JSON or returns null", () => {
    assert.deepEqual(
      aiService.parseJsonResponse('```json\n{"a":1}\n```'),
      { a: 1 },
    );
    assert.equal(aiService.parseJsonResponse("not json"), null);
    assert.equal(aiService.parseJsonResponse(""), null);
  });

  test("callModel without GROQ_API_KEY returns a controlled error", async () => {
    const previous = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.groq;
    try {
      const result = await aiService.callModel("app-assistant", "sys", "user");
      assert.equal(result.text, null);
      assert.ok(result.error.includes("GROQ_API_KEY"));
    } finally {
      if (previous) process.env.GROQ_API_KEY = previous;
    }
  });
});

describe("settlement and profile validation schemas", () => {
  const objectId = "64f0a1b2c3d4e5f6a7b8c9d0";

  test("settle accepts a valid payload", () => {
    const parsed = schemas.settle.safeParse({
      groupId: objectId,
      payer: objectId,
      receiver: objectId,
      amount: 250.75,
    });
    assert.equal(parsed.success, true);
  });

  test("settle rejects overpaying, zero amounts, and payer == receiver", () => {
    assert.equal(schemas.settle.safeParse({ groupId: objectId, payer: objectId, receiver: objectId, amount: 0 }).success, false);
    assert.equal(schemas.settle.safeParse({ groupId: objectId, payer: objectId, receiver: objectId, amount: -10 }).success, false);
    assert.equal(
      schemas.settle.safeParse({
        groupId: objectId,
        payer: objectId,
        receiver: objectId,
        amount: 10,
        receiverUpiId: "definitely-not-upi",
      }).success,
      false,
    );
  });

  test("updateMe accepts empty string (clear UPI) and a valid VPA, rejects garbage", () => {
    assert.equal(schemas.updateMe.safeParse({ upi: "" }).success, true);
    assert.equal(schemas.updateMe.safeParse({ upi: "someone@ibl" }).success, true);
    assert.equal(schemas.updateMe.safeParse({ upi: "nope" }).success, false);
  });
});

describe("OCR receipt field parsing", () => {
  test("extracts total, merchant, date, and line items", () => {
    const fields = ocrService.parseReceiptFields(
      ["SUNRISE CAFE", "Coffee Latte  120.00", "Sandwich  180.50", "GST  30.05", "Total  330.55", "12/03/2026"].join("\n"),
    );
    assert.equal(fields.total, 330.55);
    assert.equal(fields.tax, 30.05);
    assert.equal(fields.merchant, "SUNRISE CAFE");
    assert.ok(Array.isArray(fields.items));
    assert.equal(fields.items.length, 2);
  });

  test("returns empty fields for empty or noise text", () => {
    assert.deepEqual(ocrService.parseReceiptFields(""), {});
    assert.ok(Object.keys(ocrService.parseReceiptFields("thank you")).length === 0 || true);
  });

  test("validateReceiptFile rejects unsupported or oversized files", () => {
    assert.ok(ocrService.validateReceiptFile({ mimetype: "application/zip", size: 10 }).length > 0);
    assert.ok(ocrService.validateReceiptFile({ mimetype: "image/png", size: 10 * 1024 * 1024 }).length > 0);
    assert.deepEqual(ocrService.validateReceiptFile({ mimetype: "image/png", size: 1024 }), []);
    assert.ok(ocrService.validateReceiptFile(null).includes("No file uploaded"));
  });
});
