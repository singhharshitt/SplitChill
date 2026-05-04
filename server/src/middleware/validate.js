const AppError = require("../utils/appError");

function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");
  if (missing.length) {
    throw new AppError("Missing required fields", 400, { missing });
  }
}

function assertPositiveNumber(value, field) {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    throw new AppError(`${field} must be a positive number`, 400);
  }
}

module.exports = {
  assertPositiveNumber,
  requireFields,
};
