const AppError = require("../utils/appError");

function requireAdmin(req, _res, next) {
  if (req.user?.role !== "admin") return next(new AppError("Admin access required", 403));
  return next();
}

module.exports = requireAdmin;
