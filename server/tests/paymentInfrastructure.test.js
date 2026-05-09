const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-that-is-long-enough";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/splitchill_test";
process.env.HYPERSWITCH_WEBHOOK_SECRET = "test-webhook-secret";

const {
  hyperswitchStatusToLocal,
  isHyperswitchReplay,
  verifyHyperswitchSignature,
} = require("../src/services/payment.service");
const { getSmsRetryDelayMs } = require("../src/services/sms.service");

function sign(rawBody) {
  return crypto.createHmac("sha512", process.env.HYPERSWITCH_WEBHOOK_SECRET).update(rawBody).digest("hex");
}

test("verifies valid Hyperswitch webhook signatures", () => {
  const rawBody = JSON.stringify({ event_id: "evt_1", status: "succeeded" });
  assert.equal(verifyHyperswitchSignature(rawBody, sign(rawBody)), true);
});

test("rejects invalid Hyperswitch webhook signatures", () => {
  const rawBody = JSON.stringify({ event_id: "evt_1", status: "succeeded" });
  assert.equal(verifyHyperswitchSignature(rawBody, "bad-signature"), false);
});

test("maps Hyperswitch statuses to local payment states", () => {
  assert.equal(hyperswitchStatusToLocal("succeeded"), "succeeded");
  assert.equal(hyperswitchStatusToLocal("payment_processing"), "processing");
  assert.equal(hyperswitchStatusToLocal("payment_failed"), "failed");
  assert.equal(hyperswitchStatusToLocal("payment_cancelled"), "cancelled");
  assert.equal(hyperswitchStatusToLocal("requires_payment_method"), "pending");
});

test("rejects stale webhook timestamps outside tolerance", () => {
  process.env.HYPERSWITCH_WEBHOOK_TOLERANCE_MS = "300000";
  const now = Date.now();
  assert.equal(isHyperswitchReplay({ "x-webhook-timestamp": String(Math.floor(now / 1000)) }, {}, now), false);
  assert.equal(isHyperswitchReplay({ "x-webhook-timestamp": String(Math.floor((now - 600000) / 1000)) }, {}, now), true);
});

test("calculates capped exponential SMS retry delay", () => {
  assert.equal(getSmsRetryDelayMs(0), 60 * 1000);
  assert.equal(getSmsRetryDelayMs(3), 8 * 60 * 1000);
  assert.equal(getSmsRetryDelayMs(20), 60 * 60 * 1000);
});
