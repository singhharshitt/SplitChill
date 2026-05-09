const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    payer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0.01 },
    status: { type: String, enum: ["pending", "processing", "completed", "cancelled", "failed", "reconciled"], default: "completed" },
    paymentMethod: { type: String, enum: ["upi", "manual", "hyperswitch"], default: "manual" },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    upi: {
      payeeVpa: { type: String, trim: true },
      payeeName: { type: String, trim: true },
      deepLink: { type: String },
      providerReference: { type: String, trim: true },
      initiatedAt: { type: Date },
      confirmedAt: { type: Date },
    },
    note: { type: String, trim: true, maxlength: 240 },
  },
  { timestamps: true },
);

transactionSchema.index({ payer: 1, createdAt: -1 });
transactionSchema.index({ receiver: 1, createdAt: -1 });
transactionSchema.index({ group: 1, status: 1, createdAt: -1 });
transactionSchema.index({ payment: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
