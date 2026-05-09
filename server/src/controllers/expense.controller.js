const expenseService = require("../services/expense.service");
const asyncHandler = require("../utils/asyncHandler");

const addExpense = asyncHandler(async (req, res) => {
  const result = await expenseService.addExpense(req.params.id, req.user._id, req.body);
  res.status(201).json({ success: true, data: result });
});

const getExpenses = asyncHandler(async (req, res) => {
  const result = await expenseService.getExpenses(req.params.id, req.user._id, {
    limit: req.query.limit,
    cursor: req.query.cursor,
    splitType: req.query.splitType
  });
  res.json({ success: true, data: result });
});

module.exports = { addExpense, getExpenses };
