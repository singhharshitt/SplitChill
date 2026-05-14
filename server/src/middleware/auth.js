const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) throw new AppError("Authentication token required", 401);

  if (!process.env.JWT_SECRET) throw new AppError("JWT_SECRET is not configured", 500);
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError("Invalid or expired authentication token", 401);
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError("Authenticated user no longer exists", 401);

  req.user = user;
  next();
});

module.exports = protect;
