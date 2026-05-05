const logger = require("../utils/logger");

function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const payload = {
    success: false,
    error: err.message || "Internal server error",
  };

  if (err.details) payload.details = err.details;
  logger[statusCode >= 500 ? "error" : "warn"]("request_error", {
    method: req.method,
    path: req.originalUrl,
    status: statusCode,
    message: err.message,
    details: err.details,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
  if (process.env.NODE_ENV !== "production" && !err.isOperational) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = errorHandler;
