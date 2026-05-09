const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const SmsLog = require("../models/SmsLog");
const OtpChallenge = require("../models/OtpChallenge");
const User = require("../models/User");
const AppError = require("../utils/appError");

const TEXTBEE_BASE_URL = process.env.TEXTBEE_BASE_URL || "https://api.textbee.dev/api/v1";
const OTP_TTL_MS = Number(process.env.OTP_TTL_MS || 5 * 60 * 1000);

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "");
}

function canSendSms() {
  return Boolean(process.env.TEXTBEE_API_KEY && process.env.TEXTBEE_DEVICE_ID);
}

function preview(message) {
  return String(message || "").slice(0, 180);
}

function getSmsRetryDelayMs(attempts) {
  const minutes = Math.min(60, Math.pow(2, attempts));
  return minutes * 60 * 1000;
}

function nextRetryDate(attempts) {
  return new Date(Date.now() + getSmsRetryDelayMs(attempts));
}

async function sendSms({ recipient, message, purpose, user, group, payment, transaction, metadata = {} }) {
  if (!recipient) return null;
  const smsLog = await SmsLog.create({
    user,
    group,
    payment,
    transaction,
    purpose,
    recipient: normalizePhone(recipient),
    messagePreview: preview(message),
    metadata,
  });

  if (!canSendSms()) {
    smsLog.status = "failed";
    smsLog.error = "Textbee is not configured";
    smsLog.nextRetryAt = nextRetryDate(0);
    await smsLog.save();
    return smsLog;
  }

  try {
    smsLog.attempts += 1;
    const response = await fetch(`${TEXTBEE_BASE_URL}/gateway/devices/${process.env.TEXTBEE_DEVICE_ID}/send-sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.TEXTBEE_API_KEY,
      },
      body: JSON.stringify({
        recipients: [smsLog.recipient],
        message,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Textbee request failed with ${response.status}`);

    smsLog.status = "sent";
    smsLog.providerMessageId = data.id || data.smsId || data.messageId;
    smsLog.sentAt = new Date();
    smsLog.metadata = { ...smsLog.metadata, providerResponse: data };
    await smsLog.save();
    return smsLog;
  } catch (error) {
    smsLog.status = "failed";
    smsLog.error = error.message;
    smsLog.nextRetryAt = nextRetryDate(smsLog.attempts);
    await smsLog.save();
    return smsLog;
  }
}

async function resendSms(actorId, smsLogId) {
  const original = await SmsLog.findById(smsLogId);
  if (!original) throw new AppError("SMS log not found", 404);
  return sendSms({
    recipient: original.recipient,
    message: original.messagePreview,
    purpose: "admin_resend",
    user: original.user,
    group: original.group,
    payment: original.payment,
    transaction: original.transaction,
    metadata: { resentBy: actorId, originalSmsLog: original._id },
  });
}

async function startOtp(userId, phone) {
  const normalized = normalizePhone(phone);
  if (!/^\+?\d{10,15}$/.test(normalized)) throw new AppError("Valid phone number required", 400);

  const recentCount = await OtpChallenge.countDocuments({
    user: userId,
    createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
  });
  if (recentCount >= Number(process.env.OTP_RATE_LIMIT_PER_15_MIN || 3)) {
    throw new AppError("Too many OTP requests. Try again later.", 429);
  }

  const code = String(crypto.randomInt(100000, 999999));
  const codeHash = await bcrypt.hash(code, 10);
  const challenge = await OtpChallenge.create({
    user: userId,
    phone: normalized,
    codeHash,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  await sendSms({
    recipient: normalized,
    message: `Your SplitChill verification code is ${code}. It expires in 5 minutes.`,
    purpose: "otp",
    user: userId,
    metadata: { challenge: challenge._id },
  });

  return { challengeId: challenge._id, expiresAt: challenge.expiresAt };
}

async function verifyOtp(userId, challengeId, code) {
  const challenge = await OtpChallenge.findOne({ _id: challengeId, user: userId }).select("+codeHash");
  if (!challenge) throw new AppError("OTP challenge not found", 404);
  if (challenge.verifiedAt) return { verified: true };
  if (challenge.expiresAt < new Date()) throw new AppError("OTP has expired", 410);
  if (challenge.attempts >= challenge.maxAttempts) throw new AppError("OTP attempts exceeded", 429);

  challenge.attempts += 1;
  const ok = await bcrypt.compare(String(code || ""), challenge.codeHash);
  if (!ok) {
    await challenge.save();
    throw new AppError("Invalid OTP", 400);
  }

  challenge.verifiedAt = new Date();
  await Promise.all([
    challenge.save(),
    User.updateOne({ _id: userId }, { $set: { phone: challenge.phone, phoneVerifiedAt: challenge.verifiedAt } }),
  ]);
  return { verified: true };
}

async function handleTextbeeWebhook(rawBody, headers, payload) {
  const secret = process.env.TEXTBEE_WEBHOOK_SECRET;
  if (secret) {
    const expected = crypto.createHmac("sha256", secret).update(rawBody || JSON.stringify(payload)).digest("hex");
    const received = String(headers["x-signature"] || "");
    const safe = received.length === expected.length && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
    if (!safe) throw new AppError("Invalid Textbee webhook signature", 401);
  }

  if (payload.webhookEvent === "MESSAGE_DELIVERED" || payload.status === "delivered") {
    await SmsLog.updateOne(
      { providerMessageId: payload.smsId || payload.messageId },
      { $set: { status: "delivered", deliveredAt: new Date(payload.deliveredAt || Date.now()), metadata: { textbeeWebhook: payload } } },
    );
  }
  return { received: true };
}

module.exports = {
  handleTextbeeWebhook,
  resendSms,
  sendSms,
  startOtp,
  verifyOtp,
  getSmsRetryDelayMs,
};
