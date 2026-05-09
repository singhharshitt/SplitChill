const Payment = require("../models/Payment");
const PaymentEvent = require("../models/PaymentEvent");
const { applyProviderPaymentResult } = require("../services/transaction.service");

const HYPERSWITCH_BASE_URL = process.env.HYPERSWITCH_BASE_URL || "https://sandbox.hyperswitch.io";

async function fetchProviderPayment(providerPaymentId) {
  if (!process.env.HYPERSWITCH_API_KEY || !providerPaymentId || providerPaymentId.startsWith("dev_")) return null;
  const response = await fetch(`${HYPERSWITCH_BASE_URL}/payments/${providerPaymentId}`, {
    headers: {
      Accept: "application/json",
      "api-key": process.env.HYPERSWITCH_API_KEY,
    },
  });
  if (!response.ok) return null;
  return response.json();
}

function toLocalStatus(status) {
  const normalized = String(status || "").toLowerCase();
  if (["succeeded", "charged"].includes(normalized)) return "succeeded";
  if (["processing", "requires_customer_action"].includes(normalized)) return "processing";
  if (["failed", "cancelled", "canceled"].includes(normalized)) return normalized.includes("cancel") ? "cancelled" : "failed";
  return "pending";
}

async function reconcilePayments() {
  const due = await Payment.find({
    provider: "hyperswitch",
    status: { $in: ["pending", "processing"] },
    updatedAt: { $lte: new Date(Date.now() - 5 * 60 * 1000) },
  }).limit(50);

  for (const payment of due) {
    const provider = await fetchProviderPayment(payment.providerPaymentId);
    if (!provider) continue;
    const status = toLocalStatus(provider.status);
    if (status === payment.status) continue;

    const before = payment.status;
    payment.status = status;
    payment.reconciledAt = new Date();
    await payment.save();

    await PaymentEvent.create({
      payment: payment._id,
      transaction: payment.transaction,
      group: payment.group,
      provider: "hyperswitch",
      providerEventId: `reconcile_${payment.providerPaymentId}_${Date.now()}`,
      eventType: "payment_reconciled",
      statusBefore: before,
      statusAfter: status,
      payload: provider,
    });

    if (status === "succeeded") {
      await applyProviderPaymentResult({ transactionId: payment.transaction, providerReference: payment.providerPaymentId, status: "succeeded" });
      payment.status = "reconciled";
      payment.reconciledAt = new Date();
      await payment.save();
    } else if (["failed", "cancelled"].includes(status)) {
      await applyProviderPaymentResult({ transactionId: payment.transaction, providerReference: payment.providerPaymentId, status: "failed" });
    }
  }
}

function startPaymentReconciliationJob() {
  const interval = Number(process.env.PAYMENT_RECONCILIATION_INTERVAL_MS || 5 * 60 * 1000);
  if (process.env.DISABLE_BACKGROUND_JOBS === "true") return null;
  return setInterval(() => {
    reconcilePayments().catch((error) => console.error("Payment reconciliation failed", error));
  }, interval);
}

module.exports = {
  reconcilePayments,
  startPaymentReconciliationJob,
};
