const mongoose = require("mongoose");

const otpChallengeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    codeHash: { type: String, required: true, select: false },
    purpose: { type: String, enum: ["phone_verification", "payment_step_up"], default: "phone_verification" },
    attempts: { type: Number, default: 0, min: 0 },
    maxAttempts: { type: Number, default: 5 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    verifiedAt: { type: Date },
  },
  { timestamps: true },
);

otpChallengeSchema.index({ user: 1, phone: 1, createdAt: -1 });

module.exports = mongoose.model("OtpChallenge", otpChallengeSchema);
