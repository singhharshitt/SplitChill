/**
 * Expense Service with Pagination
 * File: server/src/services/expense.service.js (UPDATED)
 */

const Expense = require("../models/Expense");
const Group = require("../models/Group");
const User = require("../models/User");
const AppError = require("../utils/appError");
const { applyExpenseToGroup, calculateShares } = require("../utils/fairnessEngine");
const { emitToGroup } = require("../socket/socketHub");
const { ensureMembership } = require("./group.service");
const { paginate, buildPaginationResponse } = require("../utils/paginationUtils");

/**
 * Add a new expense to a group
 * @param {string} groupId - Group ID
 * @param {string} actorId - User creating the expense
 * @param {object} payload - Expense details
 * @returns {Promise<object>} { expense, fairness }
 */
async function addExpense(groupId, actorId, payload) {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, actorId);

  const paidBy = payload.paidBy || actorId;
  ensureMembership(group, paidBy);

  const participants = normalizeParticipants(payload.participants, group);
  assertCustomShares(payload.amount, participants, payload.splitType);
  
  const shares = calculateShares({
    amount: payload.amount,
    participants,
    members: group.members,
    splitType: payload.splitType || "equal",
  });

  const expense = await Expense.create({
    group: group._id,
    title: payload.title,
    amount: payload.amount,
    paidBy,
    participants: shares,
    splitType: payload.splitType || "equal",
  });

  const fairness = applyExpenseToGroup(group, expense);
  expense.fairnessScoreAfter = fairness.score;
  expense.insights = fairness.insights;
  
  await Promise.all([
    group.save(),
    expense.save(),
    updateUserStats(expense)
  ]);

  const populatedExpense = await Expense.findById(expense._id)
    .populate("paidBy", "name email avatar")
    .populate("participants.user", "name email avatar");

  emitToGroup(group._id, "expense:added", { groupId: group._id, expense: populatedExpense });
  emitToGroup(group._id, "fairness:changed", { groupId: group._id, fairness });
  emitToGroup(group._id, "split:updated", { 
    groupId: group._id, 
    expenseId: expense._id, 
    participants: shares 
  });

  return { expense: populatedExpense, fairness };
}

/**
 * Get paginated expenses for a group (newest first)
 * @param {string} groupId - Group ID
 * @param {string} userId - Requesting user ID
 * @param {object} options - { limit, cursor, splitType }
 * @returns {Promise<object>} { items, pagination }
 */
async function getExpenses(groupId, userId, options = {}) {
  const { limit = 25, cursor, splitType } = options;

  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 25, 10), 100);

  let query = Expense.find({ group: groupId });

  // Optional filter by split type
  if (splitType && ['equal', 'income-based', 'usage-based', 'ai-recommended', 'custom'].includes(splitType)) {
    query.where('splitType').equals(splitType);
  }

  query
    .populate("paidBy", "name email avatar")
    .populate("participants.user", "name email avatar");

  // Paginate: newest first
  const { items, hasMore, nextCursor, count } = await paginate(query, {
    limit: pageLimit,
    cursor,
    sortOrder: -1 // descending: newest first
  });

  return buildPaginationResponse(
    items,
    nextCursor,
    `/groups/${groupId}/expenses`,
    pageLimit
  );
}

/**
 * Get expenses for a specific user in a group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID to filter by (as payer or participant)
 * @param {object} options - { limit, cursor }
 * @returns {Promise<object>} Paginated expenses
 */
async function getUserExpenses(groupId, userId, options = {}) {
  const { limit = 25, cursor } = options;

  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 25, 10), 100);

  // Expenses where user is payer OR participant
  const query = Expense.find({
    group: groupId,
    $or: [
      { paidBy: userId },
      { "participants.user": userId }
    ]
  })
    .populate("paidBy", "name email avatar")
    .populate("participants.user", "name email avatar");

  const { items, hasMore, nextCursor, count } = await paginate(query, {
    limit: pageLimit,
    cursor,
    sortOrder: -1
  });

  return buildPaginationResponse(
    items,
    nextCursor,
    `/groups/${groupId}/users/${userId}/expenses`,
    pageLimit
  );
}

/**
 * Get expenses for analytics purposes (with limit, not paginated)
 * Used for fairness calculations and trending
 * @param {string} groupId - Group ID
 * @param {string} userId - Requesting user ID
 * @param {number} limit - Maximum records to fetch
 * @returns {Promise<array>} Expense documents
 */
async function getExpensesForAnalytics(groupId, userId, limit = 1000) {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  return Expense.find({ group: groupId })
    .sort({ createdAt: 1 }) // oldest first for trending
    .limit(Math.min(limit, 10000))
    .lean();
}

/**
 * Get expense statistics for a group
 * @param {string} groupId - Group ID
 * @param {string} userId - Requesting user ID
 * @returns {Promise<object>} Statistics summary
 */
async function getGroupExpenseStats(groupId, userId) {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  const ObjectId = require('mongoose').Types.ObjectId;

  const stats = await Expense.aggregate([
    { $match: { group: new ObjectId(groupId) } },
    { $group: {
        _id: "$splitType",
        count: { $sum: 1 },
        total: { $sum: "$amount" }
      }
    },
    { $sort: { total: -1 } }
  ]);

  return stats;
}

/**
 * Delete an expense
 * @param {string} expenseId - Expense ID
 * @param {string} userId - Requesting user ID (must be creator/admin)
 * @returns {Promise<object>} Deleted expense
 */
async function deleteExpense(expenseId, userId) {
  const expense = await Expense.findById(expenseId);
  if (!expense) throw new AppError("Expense not found", 404);

  const group = await Group.findById(expense.group);
  if (!group) throw new AppError("Group not found", 404);

  // Only payer or group owner can delete
  const isMember = group.members.some(m => String(m.user) === String(userId));
  if (!isMember) throw new AppError("Unauthorized", 403);

  const isCreator = String(expense.paidBy) === String(userId);
  const isOwner = String(group.owner) === String(userId);
  
  if (!isCreator && !isOwner) {
    throw new AppError("Only expense creator or group owner can delete", 403);
  }

  await Expense.deleteOne({ _id: expenseId });

  // Recalculate group fairness
  const fairness = applyExpenseToGroup(group, null, true); // third param: isDelete
  await group.save();

  emitToGroup(group._id, "expense:deleted", { 
    groupId: group._id, 
    expenseId 
  });
  emitToGroup(group._id, "fairness:changed", { groupId: group._id, fairness });

  return { success: true, expenseId };
}

/**
 * Edit an expense
 * @param {string} expenseId - Expense ID
 * @param {string} userId - Requesting user ID
 * @param {object} updates - Updates to apply
 * @returns {Promise<object>} Updated expense
 */
async function editExpense(expenseId, userId, updates) {
  const expense = await Expense.findById(expenseId);
  if (!expense) throw new AppError("Expense not found", 404);

  const group = await Group.findById(expense.group);
  if (!group) throw new AppError("Group not found", 404);

  // Only payer or group owner can edit
  const isCreator = String(expense.paidBy) === String(userId);
  const isOwner = String(group.owner) === String(userId);
  
  if (!isCreator && !isOwner) {
    throw new AppError("Only expense creator or group owner can edit", 403);
  }

  // Update allowed fields
  const allowedFields = ['title', 'amount', 'participants', 'splitType'];
  allowedFields.forEach(field => {
    if (field in updates) {
      expense[field] = updates[field];
    }
  });

  await expense.save();

  // Recalculate fairness
  const fairness = applyExpenseToGroup(group, expense);
  await group.save();

  const populated = await Expense.findById(expenseId)
    .populate("paidBy", "name email avatar")
    .populate("participants.user", "name email avatar");

  emitToGroup(group._id, "expense:updated", { 
    groupId: group._id, 
    expense: populated 
  });
  emitToGroup(group._id, "fairness:changed", { groupId: group._id, fairness });

  return populated;
}

/**
 * Helper: Normalize participants array
 */
function normalizeParticipants(participants, group) {
  const groupMemberIds = new Set(group.members.map((member) => String(member.user)));
  const input = participants?.length ? participants : [...groupMemberIds].map((user) => ({ user }));

  input.forEach((participant) => {
    if (!groupMemberIds.has(String(participant.user))) {
      throw new AppError("All participants must belong to the group", 400);
    }
  });

  return input;
}

/**
 * Helper: Validate custom shares sum
 */
function assertCustomShares(amount, participants, splitType) {
  if (splitType !== "custom") return;
  const total = participants.reduce((sum, participant) => sum + Number(participant.share || 0), 0);
  if (Math.abs(total - Number(amount)) > 0.01) {
    throw new AppError("Custom shares must add up to the expense amount", 400);
  }
}

/**
 * Helper: Update user statistics after expense creation
 */
async function updateUserStats(expense) {
  const participantOps = expense.participants.map((participant) => (
    User.updateOne(
      { _id: participant.user },
      { $inc: { "stats.totalOwed": participant.share } },
    )
  ));

  participantOps.push(
    User.updateOne(
      { _id: expense.paidBy },
      {
        $inc: {
          "stats.totalPaid": expense.amount,
          "stats.expensesCreated": 1,
        },
      },
    ),
  );

  await Promise.all(participantOps);
}

module.exports = {
  addExpense,
  getExpenses,
  getUserExpenses,
  getExpensesForAnalytics,
  getGroupExpenseStats,
  deleteExpense,
  editExpense
};
