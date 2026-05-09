const mongoose = require("mongoose");

const paymentEventSchema = new mongoose.Schema(
  {
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", index: true },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", index: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", index: true },
    provider: { type: String, enum: ["hyperswitch", "manual", "upi"], required: true, index: true },
    providerEventId: { type: String, required: true, trim: true },
    eventType: { type: String, required: true, trim: true, index: true },
    statusBefore: { type: String, trim: true },
    statusAfter: { type: String, trim: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

paymentEventSchema.index({ provider: 1, providerEventId: 1 }, { unique: true });
paymentEventSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model("PaymentEvent", paymentEventSchema);
