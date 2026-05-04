const expenseService = require("../services/expense.service");
const asyncHandler = require("../utils/asyncHandler");
const { assertPositiveNumber, requireFields } = require("../middleware/validate");

const addExpense = asyncHandler(async (req, res) => {
  requireFields(req.body, ["title", "amount"]);
  assertPositiveNumber(req.body.amount, "amount");

  const result = await expenseService.addExpense(req.params.id, req.user._id, req.body);
  res.status(201).json({ success: true, data: result });
});

const getExpenses = asyncHandler(async (req, res) => {
  const expenses = await expenseService.getExpenses(req.params.id, req.user._id);
  res.json({ success: true, data: { expenses } });
});

module.exports = { addExpense, getExpenses };
