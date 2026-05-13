function encode(value) {
  return encodeURIComponent(String(value || ""));
}

function buildUpiDeepLink({ payeeVpa, payeeName, amount, note, transactionId }) {
  const params = [
    `pa=${encode(payeeVpa)}`,
    `pn=${encode(payeeName || "SplitChill")}`,
    `am=${encode(Number(amount).toFixed(2))}`,
    "cu=INR",
    `tn=${encode(note || "SplitChill settlement")}`,
    `tr=${encode(transactionId)}`,
  ];
  return `upi://pay?${params.join("&")}`;
}

const crypto = require("crypto");
const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const PaymentEvent = require("../models/PaymentEvent");
const Transaction = require("../models/Transaction");
const Group = require("../models/Group");
const User = require("../models/User");
const WebhookLog = require("../models/WebhookLog");
const AppError = require("../utils/appError");
const { emitToGroup } = require("../socket/socketHub");
const smsService = require("./sms.service");

// Lazy-loaded to avoid circular dependency with transaction.service
let _transactionService;
function getTransactionService() {
  if (!_transactionService) _transactionService = require("./transaction.service");
  return _transactionService;
}

const HYPERSWITCH_BASE_URL = process.env.HYPERSWITCH_BASE_URL || "https://sandbox.hyperswitch.io";

function amountToMinor(amount) {
  return Math.round(Number(amount) * 100);
}

function hyperswitchStatusToLocal(status, eventType = "") {
  const normalized = String(status || eventType || "").toLowerCase();
  if (["succeeded", "charged", "payment_succeeded", "requires_capture"].includes(normalized)) return "succeeded";
  if (["processing", "payment_processing", "requires_customer_action", "requires_merchant_action"].includes(normalized)) return "processing";
  if (["failed", "payment_failed", "cancelled", "canceled", "payment_cancelled"].includes(normalized)) return normalized.includes("cancel") ? "cancelled" : "failed";
  return "pending";
}

function makeIdempotencyKey(actorId, transactionId, clientKey) {
  if (clientKey) return String(clientKey).slice(0, 160);
  return crypto.createHash("sha256").update(`${actorId}:${transactionId}:hyperswitch`).digest("hex");
}

function verifyHyperswitchSignature(rawBody, signature) {
  const secret = process.env.HYPERSWITCH_WEBHOOK_SECRET || process.env.HYPERSWITCH_PAYMENT_RESPONSE_HASH_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new AppError("Hyperswitch webhook secret is not configured", 500);
    return true;
  }
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const received = String(signature || "");
  return received.length === expected.length && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

function getWebhookTimestamp(headers = {}, payload = {}) {
  const value = headers["x-webhook-timestamp"] || headers["x-hyperswitch-timestamp"] || headers["x-event-timestamp"] || payload.created || payload.created_at;
  if (!value) return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric > 1000000000000 ? numeric : numeric * 1000;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function isHyperswitchReplay(headers = {}, payload = {}, now = Date.now()) {
  const toleranceMs = Number(process.env.HYPERSWITCH_WEBHOOK_TOLERANCE_MS || 5 * 60 * 1000);
  const timestamp = getWebhookTimestamp(headers, payload);
  if (!timestamp) return false;
  return Math.abs(now - timestamp) > toleranceMs;
}

async function createHyperswitchPaymentIntent({ payment, transaction, group }) {
  const apiKey = process.env.HYPERSWITCH_API_KEY || process.env.HyperID;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") throw new AppError("Hyperswitch API key is not configured", 500);
    return {
      payment_id: `dev_${payment._id}`,
      client_secret: `dev_secret_${payment._id}`,
      status: "requires_payment_method",
    };
  }

  const response = await fetch(`${HYPERSWITCH_BASE_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": apiKey,
      "Idempotency-Key": payment.idempotencyKey,
    },
    body: JSON.stringify({
      amount: payment.amountMinor,
      currency: payment.currency,
      confirm: false,
      capture_method: "automatic",
      description: `SplitChill settlement for ${group.name}`,
      return_url: `${process.env.CLIENT_URL?.split(",")[0] || "http://localhost:5173"}/transactions?payment=${payment._id}`,
      metadata: {
        app: "SplitChill",
        paymentId: String(payment._id),
        transactionId: String(transaction._id),
        groupId: String(group._id),
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    throw new AppError(data.error?.message || data.message || "Could not create payment session", response.status || 502);
  }
  return data;
}

async function initiatePayment(actorId, transactionId, { idempotencyKey, currency = "INR" } = {}) {
  const transaction = await Transaction.findById(transactionId)
    .populate("payer", "name email phone")
    .populate("receiver", "name email phone");
  if (!transaction) throw new AppError("Transaction not found", 404);
  const group = await Group.findById(transaction.group);
  if (!group) throw new AppError("Group not found", 404);
  const memberIds = group.members.map((member) => String(member.user?._id || member.user));
  if (!memberIds.includes(String(actorId))) throw new AppError("Group access denied", 403);
  if (String(transaction.payer._id || transaction.payer) !== String(actorId)) {
    throw new AppError("Only the payer can initiate this payment", 403);
  }
  if (["completed", "reconciled"].includes(transaction.status)) throw new AppError("Transaction is already paid", 409);

  const key = makeIdempotencyKey(actorId, transactionId, idempotencyKey);
  let payment = await Payment.findOne({ idempotencyKey: key }).select("+clientSecret");
  if (payment) return { payment, checkout: buildCheckoutResponse(payment) };

  payment = await Payment.create({
    transaction: transaction._id,
    group: group._id,
    payer: transaction.payer._id || transaction.payer,
    receiver: transaction.receiver._id || transaction.receiver,
    provider: "hyperswitch",
    amount: transaction.amount,
    amountMinor: amountToMinor(transaction.amount),
    currency,
    status: "pending",
    idempotencyKey: key,
    metadata: { initiatedBy: actorId },
  });

  const intent = await createHyperswitchPaymentIntent({ payment, transaction, group });
  payment.providerPaymentId = intent.payment_id || intent.id;
  payment.providerSessionId = intent.session_id;
  payment.clientSecret = intent.client_secret;
  payment.checkoutUrl = intent.payment_link || intent.url || intent.redirect_url;
  payment.status = hyperswitchStatusToLocal(intent.status);
  await payment.save();

  transaction.status = payment.status === "processing" ? "processing" : "pending";
  transaction.paymentMethod = "hyperswitch";
  transaction.payment = payment._id;
  if (!transaction.upi) transaction.upi = {};
  transaction.upi.initiatedAt = new Date();
  await transaction.save();

  await PaymentEvent.create({
    payment: payment._id,
    transaction: transaction._id,
    group: group._id,
    provider: "hyperswitch",
    providerEventId: `init_${payment._id}`,
    eventType: "payment_initiated",
    statusAfter: payment.status,
    payload: intent,
  });

  emitToGroup(group._id, "payment:initiated", { groupId: group._id, payment: sanitizePayment(payment), transactionId: transaction._id });
  if (transaction.payer.phone) {
    await smsService.sendSms({
      recipient: transaction.payer.phone,
      message: `SplitChill payment started for INR ${transaction.amount}. It will be marked paid only after gateway confirmation.`,
      purpose: "payment_initiated",
      user: transaction.payer._id,
      group: group._id,
      payment: payment._id,
      transaction: transaction._id,
    });
  }

  return { payment, checkout: buildCheckoutResponse(payment) };
}

function sanitizePayment(payment) {
  const obj = payment.toObject ? payment.toObject() : payment;
  delete obj.clientSecret;
  return obj;
}

function buildCheckoutResponse(payment) {
  return {
    paymentId: payment._id,
    providerPaymentId: payment.providerPaymentId,
    clientSecret: payment.clientSecret,
    checkoutUrl: payment.checkoutUrl,
    status: payment.status,
  };
}

function extractHyperswitchObject(payload) {
  return payload?.content?.object || payload?.data?.object || payload?.object || payload?.payment || payload;
}

function extractProviderEventId(payload, rawBody) {
  return String(payload.event_id || payload.id || payload.webhook_id || crypto.createHash("sha256").update(rawBody).digest("hex"));
}

async function handleHyperswitchWebhook({ rawBody, headers, payload }) {
  const eventId = extractProviderEventId(payload, rawBody);
  const signatureValid = verifyHyperswitchSignature(rawBody, headers["x-webhook-signature-512"]);
  if (!signatureValid) throw new AppError("Invalid Hyperswitch webhook signature", 401);
  if (isHyperswitchReplay(headers, payload)) throw new AppError("Stale Hyperswitch webhook rejected", 401);

  let webhookLog = await WebhookLog.findOneAndUpdate(
    { provider: "hyperswitch", eventId },
    { $setOnInsert: { provider: "hyperswitch", eventId, signatureValid, headers, payload, status: "received" } },
    { upsert: true, new: true },
  );
  if (webhookLog.status === "processed") return { duplicate: true };

  const object = extractHyperswitchObject(payload);
  const providerPaymentId = object.payment_id || object.id || payload.payment_id;
  const metadata = object.metadata || payload.metadata || {};
  const paymentFilters = [];
  if (providerPaymentId) paymentFilters.push({ providerPaymentId });
  if (metadata.paymentId && mongoose.Types.ObjectId.isValid(metadata.paymentId)) paymentFilters.push({ _id: metadata.paymentId });
  const payment = paymentFilters.length
    ? await Payment.findOne({ $or: paymentFilters }).select("+clientSecret")
    : null;

  if (!payment) {
    webhookLog.status = "ignored";
    webhookLog.error = "Payment record not found";
    webhookLog.processedAt = new Date();
    await webhookLog.save();
    return { ignored: true };
  }

  const existingEvent = await PaymentEvent.findOne({ provider: "hyperswitch", providerEventId: eventId });
  if (existingEvent) {
    webhookLog.status = "processed";
    webhookLog.processedAt = new Date();
    await webhookLog.save();
    return { duplicate: true };
  }

  const previousStatus = payment.status;
  const eventType = payload.event_type || payload.type || object.event_type || "payment_event";
  const nextStatus = hyperswitchStatusToLocal(object.status, eventType);

  payment.status = nextStatus;
  payment.lastWebhookAt = new Date();
  if (providerPaymentId) payment.providerPaymentId = providerPaymentId;
  if (["failed", "cancelled"].includes(nextStatus)) {
    payment.failureCode = object.error_code || object.cancellation_reason;
    payment.failureMessage = object.error_message || object.message;
  }
  await payment.save();

  await PaymentEvent.create({
    payment: payment._id,
    transaction: payment.transaction,
    group: payment.group,
    provider: "hyperswitch",
    providerEventId: eventId,
    eventType,
    statusBefore: previousStatus,
    statusAfter: nextStatus,
    payload,
  });

  const { applyProviderPaymentResult } = getTransactionService();
  if (nextStatus === "succeeded") {
    await applyProviderPaymentResult({ transactionId: payment.transaction, providerReference: providerPaymentId, status: "succeeded" });
    const payerUser = await User.findById(payment.payer).select("phone");
    if (payerUser?.phone) {
      await smsService.sendSms({
        recipient: payerUser.phone,
        message: `SplitChill payment of INR ${payment.amount} succeeded and your group balances were updated.`,
        purpose: "payment_success",
        user: payment.payer,
        group: payment.group,
        payment: payment._id,
        transaction: payment.transaction,
      });
    }
  } else if (["failed", "cancelled"].includes(nextStatus)) {
    await applyProviderPaymentResult({ transactionId: payment.transaction, providerReference: providerPaymentId, status: "failed" });
    const payerUser = await User.findById(payment.payer).select("phone");
    if (payerUser?.phone) {
      await smsService.sendSms({
        recipient: payerUser.phone,
        message: `SplitChill payment of INR ${payment.amount} failed. Please retry or settle manually.`,
        purpose: "payment_failed",
        user: payment.payer,
        group: payment.group,
        payment: payment._id,
        transaction: payment.transaction,
      });
    }
  } else {
    emitToGroup(payment.group, "payment:updated", { groupId: payment.group, payment: sanitizePayment(payment), transactionId: payment.transaction });
  }

  webhookLog.status = "processed";
  webhookLog.processedAt = new Date();
  await webhookLog.save();
  return { processed: true };
}

async function getPayments(userId, { groupId, limit = 20, cursor, status } = {}) {
  const { paginate, buildPaginationResponse } = require("../utils/paginationUtils");
  const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 10), 100);
  const query = Payment.find(status ? { status } : {});
  if (groupId) query.where("group").equals(groupId);
  query.or([{ payer: userId }, { receiver: userId }])
    .populate("payer", "name email")
    .populate("receiver", "name email")
    .populate("transaction")
    .populate("group", "name");

  const { items, nextCursor } = await paginate(query, { limit: pageLimit, cursor, sortOrder: -1 });
  return buildPaginationResponse(items, nextCursor, "/payments", pageLimit);
}

async function getPaymentEvents(userId, paymentId, { limit = 20, cursor } = {}) {
  const { paginate, buildPaginationResponse } = require("../utils/paginationUtils");
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new AppError("Payment not found", 404);
  if (![payment.payer, payment.receiver].some((id) => String(id) === String(userId))) {
    const group = await Group.findById(payment.group);
    if (!group?.members?.some((member) => String(member.user) === String(userId))) throw new AppError("Payment access denied", 403);
  }
  const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 10), 100);
  const query = PaymentEvent.find({ payment: paymentId });
  const { items, nextCursor } = await paginate(query, { limit: pageLimit, cursor, sortOrder: -1 });
  return buildPaginationResponse(items, nextCursor, `/payments/${paymentId}/events`, pageLimit);
}

module.exports = {
  buildUpiDeepLink,
  getPaymentEvents,
  getPayments,
  handleHyperswitchWebhook,
  hyperswitchStatusToLocal,
  initiatePayment,
  isHyperswitchReplay,
  verifyHyperswitchSignature,
};
