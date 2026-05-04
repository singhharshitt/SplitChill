const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/appError");

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET || "dev_split_chill_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

async function register({ name, email, password, income = 0 }) {
  const existing = await User.findOne({ email: String(email).toLowerCase() });
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

  return { user: user.toSafeObject(), token: signToken(user) };
}

async function login({ email, password }) {
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) throw new AppError("Invalid email or password", 401);

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw new AppError("Invalid email or password", 401);

  return { user: user.toSafeObject(), token: signToken(user) };
}

module.exports = { login, register };
