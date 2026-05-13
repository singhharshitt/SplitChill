const crypto = require("crypto");

function correlationId(req, _res, next) {
  req.correlationId = req.headers["x-request-id"] || crypto.randomUUID();
  next();
}

module.exports = correlationId;
