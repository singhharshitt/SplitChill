const mongoose = require("mongoose");

const smsLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", index: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", index: true },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", index: true },
    purpose: {
      type: String,
      enum: ["otp", "payment_initiated", "payment_success", "payment_failed", "admin_notification", "admin_resend"],
      required: true,
      index: true,
    },
    recipient: { type: String, required: true, trim: true },
    messagePreview: { type: String, trim: true, maxlength: 180 },
    provider: { type: String, default: "textbee" },
    providerMessageId: { type: String, trim: true },
    status: { type: String, enum: ["queued", "sent", "failed", "delivered"], default: "queued", index: true },
    attempts: { type: Number, default: 0, min: 0 },
    error: { type: String, trim: true },
    nextRetryAt: { type: Date, index: true },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

smsLogSchema.index({ createdAt: -1 });
smsLogSchema.index({ status: 1, nextRetryAt: 1 });

module.exports = mongoose.model("SmsLog", smsLogSchema);
