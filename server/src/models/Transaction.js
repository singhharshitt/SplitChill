const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    payer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0.01 },
    status: { type: String, enum: ["pending", "completed", "cancelled"], default: "completed" },
    note: { type: String, trim: true, maxlength: 240 },
  },
  { timestamps: true },
);

transactionSchema.index({ payer: 1, createdAt: -1 });
transactionSchema.index({ receiver: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
