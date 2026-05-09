const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", required: true, index: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    payer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: { type: String, enum: ["hyperswitch", "manual", "upi"], default: "hyperswitch", index: true },
    providerPaymentId: { type: String, trim: true, sparse: true, index: true },
    providerSessionId: { type: String, trim: true },
    clientSecret: { type: String, select: false },
    checkoutUrl: { type: String },
    amount: { type: Number, required: true, min: 0.01 },
    amountMinor: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "INR", uppercase: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "processing", "succeeded", "failed", "cancelled", "reconciled"],
      default: "pending",
      index: true,
    },
    idempotencyKey: { type: String, required: true, unique: true, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    failureCode: { type: String, trim: true },
    failureMessage: { type: String, trim: true },
    nextRetryAt: { type: Date, index: true },
    retryCount: { type: Number, default: 0, min: 0 },
    reconciledAt: { type: Date },
    lastWebhookAt: { type: Date },
  },
  { timestamps: true },
);

paymentSchema.index({ group: 1, createdAt: -1 });
paymentSchema.index({ transaction: 1, status: 1 });
paymentSchema.index({ status: 1, nextRetryAt: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
