const authService = require("../services/auth.service");
const asyncHandler = require("../utils/asyncHandler");
const { assertPositiveNumber, requireFields } = require("../middleware/validate");

const register = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "email", "password"]);
  if (req.body.income !== undefined) assertPositiveNumber(req.body.income, "income");

  const result = await authService.register(req.body);
  res.status(201).json({ success: true, data: result });
});

const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ["email", "password"]);
  const result = await authService.login(req.body);
  res.json({ success: true, data: result });
});

module.exports = { login, register };
