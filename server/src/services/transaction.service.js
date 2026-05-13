const mongoose = require("mongoose");
const Group = require("../models/Group");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const AppError = require("../utils/appError");
const { applySettlementToGroup } = require("../utils/fairnessEngine");
const { buildUpiDeepLink } = require("./payment.service");
const { emitToGroup } = require("../socket/socketHub");
const { ensureMembership } = require("./group.service");
const { paginate, buildPaginationResponse } = require("../utils/paginationUtils");

async function settle(actorId, { groupId, payer, receiver, amount, note, receiverUpiId }) {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, actorId);
  ensureMembership(group, payer);
  ensureMembership(group, receiver);
  if (String(actorId) !== String(payer)) {
    throw new AppError("Only the payer can initiate this settlement", 403);
  }
  if (String(payer) === String(receiver)) {
    throw new AppError("Payer and receiver must be different members", 400);
  }

  const receiverUser = await User.findById(receiver).select("name email");
  if (!receiverUser) throw new AppError("Receiver not found", 404);
  const status = receiverUpiId ? "pending" : "completed";
  const paymentMethod = receiverUpiId ? "upi" : "manual";

  const transaction = await Transaction.create({
    group: groupId,
    payer,
    receiver,
    amount,
    note,
    status,
    paymentMethod,
    upi: receiverUpiId ? {
      payeeVpa: receiverUpiId,
      payeeName: receiverUser.name,
      initiatedAt: new Date(),
    } : undefined,
  });

  if (receiverUpiId) {
    transaction.upi.deepLink = buildUpiDeepLink({
      payeeVpa: receiverUpiId,
      payeeName: receiverUser.name,
      amount,
      note,
      transactionId: transaction._id,
    });
    await transaction.save();
  }

  let fairness = null;
  if (status === "completed") {
    // ── Atomic multi-document write via MongoDB session ──
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        fairness = applySettlementToGroup(group, transaction);
        await group.save({ session });
        await User.updateOne({ _id: payer }, { $inc: { "stats.settlementsMade": 1 } }, { session });
        await User.updateOne({ _id: receiver }, { $inc: { "stats.settlementsReceived": 1 } }, { session });
      });
    } finally {
      await session.endSession();
    }
  }

  const populated = await Transaction.findById(transaction._id)
    .populate("payer", "name email avatar")
    .populate("receiver", "name email avatar")
    .populate("group", "name fairnessScore");

  emitToGroup(groupId, "transaction:created", { groupId, transaction: populated });
  if (fairness) emitToGroup(groupId, "fairness:changed", { groupId, fairness });
  emitToGroup(groupId, "group:updated", { groupId, action: status === "pending" ? "settlement_pending" : "settlement_completed" });

  return { transaction: populated, fairness };
}

async function confirmPayment(actorId, transactionId, { status = "completed", providerReference }) {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw new AppError("Transaction not found", 404);
  const group = await Group.findById(transaction.group);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, actorId);

  const isParticipant = [transaction.payer, transaction.receiver].some((id) => String(id) === String(actorId));
  if (!isParticipant) throw new AppError("Only settlement participants can update payment status", 403);
  if (transaction.status !== "pending") throw new AppError("Only pending transactions can be confirmed", 409);
  if (transaction.paymentMethod === "hyperswitch") {
    throw new AppError("Hyperswitch payments can only be completed by verified server webhooks or reconciliation", 409);
  }

  transaction.status = status;
  if (providerReference || status === "completed") {
    if (!transaction.upi) transaction.upi = {};
    if (providerReference) transaction.upi.providerReference = providerReference;
    if (status === "completed") transaction.upi.confirmedAt = new Date();
  }

  let fairness = null;
  if (status === "completed") {
    // ── Atomic multi-document write via MongoDB session ──
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        fairness = applySettlementToGroup(group, transaction);
        await group.save({ session });
        await transaction.save({ session });
        await User.updateOne({ _id: transaction.payer }, { $inc: { "stats.settlementsMade": 1 } }, { session });
        await User.updateOne({ _id: transaction.receiver }, { $inc: { "stats.settlementsReceived": 1 } }, { session });
      });
    } finally {
      await session.endSession();
    }
  } else {
    await transaction.save();
  }

  const populated = await Transaction.findById(transaction._id)
    .populate("payer", "name email avatar")
    .populate("receiver", "name email avatar")
    .populate("group", "name fairnessScore");

  emitToGroup(group._id, "transaction:updated", { groupId: group._id, transaction: populated });
  if (fairness) emitToGroup(group._id, "fairness:changed", { groupId: group._id, fairness });
  emitToGroup(group._id, "group:updated", { groupId: group._id, action: status === "completed" ? "settlement_completed" : `settlement_${status}` });

  return { transaction: populated, fairness };
}

async function getTransactions(userId, options = {}) {
  const { groupId, limit = 20, cursor, status } = options;

  const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 10), 100);

  let query;
  if (groupId) {
    const group = await Group.findById(groupId);
    if (!group) throw new AppError("Group not found", 404);
    ensureMembership(group, userId);
    
    query = Transaction.find({ group: groupId });
  } else {
    query = Transaction.find({
      $or: [{ payer: userId }, { receiver: userId }]
    });
  }

  if (status && ['pending', 'processing', 'completed', 'cancelled', 'failed', 'reconciled'].includes(status)) {
    query.where('status').equals(status);
  }

  query
    .populate("payer", "name email avatar")
    .populate("receiver", "name email avatar")
    .populate("group", "name")
    .populate("payment");

  const { items, hasMore, nextCursor, count } = await paginate(query, {
    limit: pageLimit,
    cursor,
    sortOrder: -1
  });

  const endpoint = groupId 
    ? `/transactions?groupId=${groupId}`
    : `/transactions`;

  return buildPaginationResponse(items, nextCursor, endpoint, pageLimit);
}

async function applyProviderPaymentResult({ transactionId, providerReference, status }) {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw new AppError("Transaction not found", 404);
  const group = await Group.findById(transaction.group);
  if (!group) throw new AppError("Group not found", 404);

  // ── Idempotency: skip if already applied ──
  if (["completed", "reconciled"].includes(transaction.status)) {
    return { transaction, group, fairness: null, alreadyApplied: true };
  }

  if (providerReference || status === "succeeded") {
    if (!transaction.upi) transaction.upi = {};
    if (providerReference) transaction.upi.providerReference = providerReference;
    if (status === "succeeded") transaction.upi.confirmedAt = new Date();
  }
  transaction.status = status === "succeeded" ? "completed" : status;

  let fairness = null;
  if (status === "succeeded") {
    // ── Atomic multi-document write via MongoDB session ──
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        fairness = applySettlementToGroup(group, transaction);
        await group.save({ session });
        await transaction.save({ session });
        await User.updateOne({ _id: transaction.payer }, { $inc: { "stats.settlementsMade": 1 } }, { session });
        await User.updateOne({ _id: transaction.receiver }, { $inc: { "stats.settlementsReceived": 1 } }, { session });
      });
    } finally {
      await session.endSession();
    }
  } else {
    await transaction.save();
  }

  const populated = await Transaction.findById(transaction._id)
    .populate("payer", "name email avatar")
    .populate("receiver", "name email avatar")
    .populate("group", "name fairnessScore");

  emitToGroup(group._id, "transaction:updated", { groupId: group._id, transaction: populated });
  if (fairness) emitToGroup(group._id, "fairness:changed", { groupId: group._id, fairness });
  emitToGroup(group._id, "payment:updated", { groupId: group._id, transactionId: transaction._id, status });
  emitToGroup(group._id, "group:updated", { groupId: group._id, action: status === "succeeded" ? "settlement_completed" : `payment_${status}` });

  return { transaction: populated, group, fairness, alreadyApplied: false };
}

module.exports = {
  applyProviderPaymentResult,
  confirmPayment,
  getTransactions,
  settle,
};
