const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    payer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0.01 },
    status: {
      type: String,
      enum: ["pending", "reported_paid", "recipient_confirmed", "completed", "cancelled", "failed"],
      default: "completed",
      index: true,
    },
    paymentMethod: { type: String, enum: ["upi", "manual"], default: "manual" },
    note: { type: String, trim: true, maxlength: 240 },
    upi: {
      payeeVpa: { type: String, trim: true },
      payeeName: { type: String, trim: true },
      deepLink: { type: String },
      qrDataUrl: { type: String },
      providerReference: { type: String, trim: true },
      initiatedAt: { type: Date },
      reportedAt: { type: Date },
      confirmedAt: { type: Date },
    },
  },
  { timestamps: true },
);

transactionSchema.index({ payer: 1, createdAt: -1 });
transactionSchema.index({ receiver: 1, createdAt: -1 });
transactionSchema.index({ group: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
