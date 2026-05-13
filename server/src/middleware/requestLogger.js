const logger = require("../utils/logger");

function requestLogger(req, res, next) {
  const startedAt = Date.now();
  res.on("finish", () => {
    logger.info("http_request", {
      correlationId: req.correlationId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
      userId: req.user?._id?.toString(),
    });
  });
  next();
}

module.exports = requestLogger;
