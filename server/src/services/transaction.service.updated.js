/**
 * Transaction Service with Pagination
 * File: server/src/services/transaction.service.js (UPDATED)
 */

const Group = require("../models/Group");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const AppError = require("../utils/appError");
const { applySettlementToGroup } = require("../utils/fairnessEngine");
const { buildUpiDeepLink } = require("./payment.service");
const { emitToGroup } = require("../socket/socketHub");
const { ensureMembership } = require("./group.service");
const { paginate, buildPaginationResponse } = require("../utils/paginationUtils");

/**
 * Create and settle a transaction between two group members
 * @param {string} actorId - User creating the settlement (must be payer)
 * @param {object} payload - Settlement details
 * @returns {Promise<object>} { transaction, fairness }
 */
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
    fairness = applySettlementToGroup(group, transaction);
    await Promise.all([
      group.save(),
      User.updateOne({ _id: payer }, { $inc: { "stats.settlementsMade": 1 } }),
      User.updateOne({ _id: receiver }, { $inc: { "stats.settlementsReceived": 1 } }),
    ]);
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

/**
 * Confirm payment status for a pending transaction
 * @param {string} actorId - User confirming payment
 * @param {string} transactionId - Transaction ID
 * @param {object} payload - Confirmation details { status, providerReference }
 * @returns {Promise<object>} { transaction, fairness }
 */
async function confirmPayment(actorId, transactionId, { status = "completed", providerReference }) {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw new AppError("Transaction not found", 404);
  
  const group = await Group.findById(transaction.group);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, actorId);

  const isParticipant = [transaction.payer, transaction.receiver].some((id) => String(id) === String(actorId));
  if (!isParticipant) throw new AppError("Only settlement participants can update payment status", 403);
  if (transaction.status !== "pending") throw new AppError("Only pending transactions can be confirmed", 409);

  transaction.status = status;
  if (providerReference) transaction.upi.providerReference = providerReference;
  if (status === "completed") transaction.upi.confirmedAt = new Date();

  let fairness = null;
  if (status === "completed") {
    fairness = applySettlementToGroup(group, transaction);
    await Promise.all([
      group.save(),
      transaction.save(),
      User.updateOne({ _id: transaction.payer }, { $inc: { "stats.settlementsMade": 1 } }),
      User.updateOne({ _id: transaction.receiver }, { $inc: { "stats.settlementsReceived": 1 } }),
    ]);
  } else {
    await transaction.save();
  }

  const populated = await Transaction.findById(transaction._id)
    .populate("payer", "name email avatar")
    .populate("receiver", "name email avatar")
    .populate("group", "name fairnessScore");

  emitToGroup(group._id, "transaction:updated", { groupId: group._id, transaction: populated });
  if (fairness) emitToGroup(group._id, "fairness:changed", { groupId: group._id, fairness });
  emitToGroup(group._id, "group:updated", { 
    groupId: group._id, 
    action: status === "completed" ? "settlement_completed" : `settlement_${status}` 
  });

  return { transaction: populated, fairness };
}

/**
 * Get paginated transactions
 * Can fetch for a specific group or for user across all groups
 * @param {string} userId - Requesting user ID
 * @param {object} options - { groupId, limit, cursor, status }
 * @returns {Promise<object>} { items, pagination }
 */
async function getTransactions(userId, options = {}) {
  const { groupId, limit = 20, cursor, status } = options;

  const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 10), 100);

  // Build query based on context
  let query;
  if (groupId) {
    const group = await Group.findById(groupId);
    if (!group) throw new AppError("Group not found", 404);
    ensureMembership(group, userId);
    
    query = Transaction.find({ group: groupId });
  } else {
    // User's transactions across all groups
    query = Transaction.find({
      $or: [{ payer: userId }, { receiver: userId }]
    });
  }

  // Add status filter if provided and valid
  if (status && ['pending', 'completed', 'cancelled', 'failed'].includes(status)) {
    query.where('status').equals(status);
  }

  query
    .populate("payer", "name email avatar")
    .populate("receiver", "name email avatar")
    .populate("group", "name");

  // Paginate: newest first
  const { items, hasMore, nextCursor, count } = await paginate(query, {
    limit: pageLimit,
    cursor,
    sortOrder: -1 // descending: newest first
  });

  const endpoint = groupId 
    ? `/groups/${groupId}/transactions`
    : `/transactions`;

  return buildPaginationResponse(items, nextCursor, endpoint, pageLimit);
}

/**
 * Get transaction statistics for a group
 * Used for analytics dashboard
 * @param {string} groupId - Group ID
 * @param {string} userId - Requesting user ID
 * @returns {Promise<array>} Aggregated statistics
 */
async function getGroupTransactionStats(groupId, userId) {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  const stats = await Transaction.aggregate([
    { $match: { group: new require('mongoose').Types.ObjectId(groupId) } },
    { $group: {
        _id: "$status",
        count: { $sum: 1 },
        total: { $sum: "$amount" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return stats;
}

/**
 * Get transactions for a specific user in a group
 * Useful for personal transaction history
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID (requester and target are same)
 * @param {object} options - { limit, cursor }
 * @returns {Promise<object>} Paginated user transactions
 */
async function getUserGroupTransactions(groupId, userId, options = {}) {
  const { limit = 20, cursor } = options;

  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 10), 100);

  // Transactions where user is payer OR receiver
  const query = Transaction.find({
    group: groupId,
    $or: [{ payer: userId }, { receiver: userId }]
  })
    .populate("payer", "name email avatar")
    .populate("receiver", "name email avatar");

  const { items, hasMore, nextCursor, count } = await paginate(query, {
    limit: pageLimit,
    cursor,
    sortOrder: -1
  });

  return buildPaginationResponse(
    items,
    nextCursor,
    `/groups/${groupId}/users/${userId}/transactions`,
    pageLimit
  );
}

/**
 * Get pending transactions that require user's action
 * @param {string} userId - User ID
 * @param {object} options - { limit, cursor }
 * @returns {Promise<object>} Paginated pending transactions
 */
async function getPendingTransactions(userId, options = {}) {
  const { limit = 20, cursor } = options;

  const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 10), 100);

  const query = Transaction.find({
    status: "pending",
    $or: [
      { payer: userId }, // User initiated payment
      { receiver: userId } // User needs to confirm receipt
    ]
  })
    .populate("payer", "name email avatar")
    .populate("receiver", "name email avatar")
    .populate("group", "name");

  const { items, hasMore, nextCursor, count } = await paginate(query, {
    limit: pageLimit,
    cursor,
    sortOrder: -1
  });

  return buildPaginationResponse(
    items,
    nextCursor,
    `/transactions/pending`,
    pageLimit
  );
}

module.exports = {
  confirmPayment,
  getTransactions,
  getGroupTransactionStats,
  getUserGroupTransactions,
  getPendingTransactions,
  settle,
};
