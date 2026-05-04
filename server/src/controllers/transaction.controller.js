const transactionService = require("../services/transaction.service");
const asyncHandler = require("../utils/asyncHandler");
const { assertPositiveNumber, requireFields } = require("../middleware/validate");

const settle = asyncHandler(async (req, res) => {
  requireFields(req.body, ["groupId", "payer", "receiver", "amount"]);
  assertPositiveNumber(req.body.amount, "amount");

  const result = await transactionService.settle(req.user._id, req.body);
  res.status(201).json({ success: true, data: result });
});

const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await transactionService.getTransactions(req.user._id, req.query.groupId);
  res.json({ success: true, data: { transactions } });
});

module.exports = { getTransactions, settle };
