const mongoose = require("mongoose");

const webhookLogSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, index: true },
    eventId: { type: String, required: true, trim: true },
    signatureValid: { type: Boolean, default: false },
    status: { type: String, enum: ["received", "processed", "ignored", "failed"], default: "received", index: true },
    headers: { type: mongoose.Schema.Types.Mixed, default: {} },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    error: { type: String, trim: true },
    processedAt: { type: Date },
  },
  { timestamps: true },
);

webhookLogSchema.index({ provider: 1, eventId: 1 }, { unique: true });
webhookLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("WebhookLog", webhookLogSchema);
