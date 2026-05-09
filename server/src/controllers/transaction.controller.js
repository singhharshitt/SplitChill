const transactionService = require("../services/transaction.service");
const asyncHandler = require("../utils/asyncHandler");

const settle = asyncHandler(async (req, res) => {
  const result = await transactionService.settle(req.user._id, req.body);
  res.status(201).json({ success: true, data: result });
});

const confirmPayment = asyncHandler(async (req, res) => {
  const result = await transactionService.confirmPayment(req.user._id, req.params.id, req.body);
  res.json({ success: true, data: result });
});

const getTransactions = asyncHandler(async (req, res) => {
  const result = await transactionService.getTransactions(req.user._id, {
    groupId: req.query.groupId,
    limit: req.query.limit,
    cursor: req.query.cursor,
    status: req.query.status
  });
  res.json({ success: true, data: result });
});

module.exports = { confirmPayment, getTransactions, settle };
