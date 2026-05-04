function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const payload = {
    success: false,
    error: err.message || "Internal server error",
  };

  if (err.details) payload.details = err.details;
  if (process.env.NODE_ENV !== "production" && !err.isOperational) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = errorHandler;
