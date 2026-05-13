const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/appError");

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" },
  );
}

function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function issueSession(user) {
  const refreshToken = crypto.randomBytes(48).toString("hex");
  user.refreshTokenHash = hashRefreshToken(refreshToken);
  user.refreshTokenExpiresAt = new Date(Date.now() + Number(process.env.REFRESH_TOKEN_TTL_MS || 30 * 24 * 60 * 60 * 1000));
  await user.save();
  return {
    user: user.toSafeObject(),
    token: signAccessToken(user),
    refreshToken,
  };
}

async function register({ name, email, password, income = 0 }) {
  const existing = await User.findOne({ email: String(email).toLowerCase() }).lean();
  if (existing) throw new AppError("Email is already registered", 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    income,
    stats: {
      participationScore: 1,
      paymentConsistency: 1,
    },
  });

  return issueSession(user);
}

async function login({ email, password }) {
  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+refreshTokenHash +refreshTokenExpiresAt");
  if (!user) throw new AppError("Invalid email or password", 401);

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw new AppError("Invalid email or password", 401);

  return issueSession(user);
}

async function refresh(refreshToken) {
  const tokenHash = hashRefreshToken(refreshToken);
  const user = await User.findOne({
    refreshTokenHash: tokenHash,
    refreshTokenExpiresAt: { $gt: new Date() },
  }).select("+refreshTokenHash +refreshTokenExpiresAt");

  if (!user) throw new AppError("Refresh token is invalid or expired", 401);
  return issueSession(user);
}

async function logout(userId) {
  await User.updateOne(
    { _id: userId },
    { $unset: { refreshTokenHash: "", refreshTokenExpiresAt: "" } },
  );
}

module.exports = { login, logout, refresh, register };
