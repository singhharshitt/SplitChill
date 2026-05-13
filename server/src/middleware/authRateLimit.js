const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: "Too many auth attempts. Please try again later." },
  keyGenerator: (req) => req.ip,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 7,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: "Too many login attempts. Please try again later." },
  keyGenerator: (req) => req.ip,
});

module.exports = { authLimiter, loginLimiter };
