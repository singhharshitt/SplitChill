const mongoose = require("mongoose");

const userStatsSchema = new mongoose.Schema(
  {
    totalPaid: { type: Number, default: 0, min: 0 },
    totalOwed: { type: Number, default: 0, min: 0 },
    settlementsMade: { type: Number, default: 0, min: 0 },
    settlementsReceived: { type: Number, default: 0, min: 0 },
    delayedSettlements: { type: Number, default: 0, min: 0 },
    expensesCreated: { type: Number, default: 0, min: 0 },
    participationScore: { type: Number, default: 1, min: 0, max: 2 },
    paymentConsistency: { type: Number, default: 1, min: 0, max: 1 },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    refreshTokenHash: { type: String, select: false },
    refreshTokenExpiresAt: { type: Date, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    phone: { type: String, trim: true },
    phoneVerifiedAt: { type: Date },
    income: { type: Number, default: 0, min: 0 },
    stats: { type: userStatsSchema, default: () => ({}) },
  },
  { timestamps: true },
);

userSchema.methods.toSafeObject = function toSafeObject() {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.refreshTokenHash;
  delete user.refreshTokenExpiresAt;
  delete user.__v;
  return user;
};

module.exports = mongoose.model("User", userSchema);
