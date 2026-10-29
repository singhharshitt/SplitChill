const mongoose = require("mongoose");
const Expense = require("../models/Expense");
const Group = require("../models/Group");
const User = require("../models/User");
const AppError = require("../utils/appError");
const { applyExpenseToGroup, calculateFairness, calculateShares, clamp, roundMoney } = require("../utils/fairnessEngine");
const { emitToGroup } = require("../socket/socketHub");
const { ensureMembership } = require("./group.service");
const { paginate, buildPaginationResponse } = require("../utils/paginationUtils");

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
  await Promise.all([group.save(), expense.save(), updateUserStats(expense)]);

  const populatedExpense = await Expense.findById(expense._id)
    .populate("paidBy", "name email avatar")
    .populate("participants.user", "name email avatar");

  emitToGroup(group._id, "expense:added", { groupId: group._id, expense: populatedExpense });
  emitToGroup(group._id, "fairness:changed", { groupId: group._id, fairness });
  emitToGroup(group._id, "split:updated", { groupId: group._id, expenseId: expense._id, participants: shares });

  return { expense: populatedExpense, fairness };
}

function assertCustomShares(amount, participants, splitType) {
  if (splitType !== "custom") return;
  const total = participants.reduce((sum, participant) => sum + Number(participant.share || 0), 0);
  if (Math.abs(total - Number(amount)) > 0.01) {
    throw new AppError("Custom shares must add up to the expense amount", 400);
  }
}

/**
 * Reverse an expense's contribution to group-member balances (used for edits/deletes).
 * Mirrors the arithmetic of applyExpenseToGroup with negation.
 */
function unapplyExpenseToGroup(group, expense) {
  const shareMap = new Map(expense.participants.map((participant) => [String(participant.user), participant.share]));
  const payerId = String(expense.paidBy);

  group.members.forEach((member) => {
    const memberId = getMemberId(member);
    const share = shareMap.get(memberId) || 0;
    member.totalShare = roundMoney((member.totalShare || 0) - share);
    member.totalPaid = roundMoney((member.totalPaid || 0) - (memberId === payerId ? expense.amount : 0));
    member.netBalance = roundMoney((member.totalPaid || 0) - (member.totalShare || 0));
    member.underpaymentStreak = member.netBalance < 0
      ? (member.underpaymentStreak || 0) + 1
      : 0;
    member.paymentConsistency = clamp(1 - (member.underpaymentStreak || 0) * 0.08, 0.4, 1);
  });

  const fairness = calculateFairness(group);
  group.fairnessScore = fairness.score;
  group.fairnessHistory.push({
    score: fairness.score,
    imbalance: fairness.imbalance,
    calculatedAt: new Date(),
  });
  if (group.fairnessHistory.length > 50) {
    group.fairnessHistory = group.fairnessHistory.slice(-50);
  }

  return fairness;
}

function getMemberId(member) {
  return String(member.user?._id || member.user);
}

async function updateExpense(groupId, expenseId, actorId, payload) {
  const expense = await Expense.findById(expenseId);
  if (!expense) throw new AppError("Expense not found", 404);
  if (String(expense.group) !== String(groupId)) throw new AppError("Expense does not belong to this group", 400);

  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, actorId);

  const paidBy = payload.paidBy || expense.paidBy;
  ensureMembership(group, paidBy);
  if (payload.paidBy) ensureMembership(group, payload.paidBy);

  const title = payload.title ?? expense.title;
  const amount = payload.amount ?? expense.amount;
  const splitType = payload.splitType ?? expense.splitType;

  const participantsInput = payload.participants || expense.participants.map((p) => ({ user: p.user, usage: p.usage, share: p.share }));
  const participants = normalizeParticipants(participantsInput, group);
  assertCustomShares(amount, participants, splitType);

  const newShares = calculateShares({
    amount,
    participants,
    members: group.members,
    splitType,
  });

  // ── Roll back the old expense state and apply the new one atomically ──
  let fairness;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const freshGroup = await Group.findById(group._id).session(session);
      unapplyExpenseToGroup(freshGroup, expense);

      const updated = {
        title,
        amount,
        paidBy,
        participants: newShares,
        splitType,
      };
      const applyResult = applyExpenseToGroup(freshGroup, { ...expense.toObject(), ...updated });
      expense.set(updated);
      expense.fairnessScoreAfter = applyResult.score;
      expense.insights = applyResult.insights;

      await freshGroup.save({ session });
      await expense.save({ session });
      fairness = applyResult;
    });
  } finally {
    await session.endSession();
  }

  const populatedExpense = await Expense.findById(expense._id)
    .populate("paidBy", "name email avatar")
    .populate("participants.user", "name email avatar");

  // ── Reverse the old lifetime stats and add the new ones (best effort) ──
  const statOps = [];
  expense.participants.forEach((participant) => {
    statOps.push(User.updateOne({ _id: participant.user }, { $inc: { "stats.totalOwed": -participant.share } }));
  });
  statOps.push(User.updateOne({ _id: expense.paidBy }, { $inc: { "stats.totalPaid": -expense.amount, "stats.expensesCreated": -1 } }));
  newShares.forEach((participant) => {
    statOps.push(User.updateOne({ _id: participant.user }, { $inc: { "stats.totalOwed": participant.share } }));
  });
  statOps.push(User.updateOne({ _id: paidBy }, { $inc: { "stats.totalPaid": amount, "stats.expensesCreated": 1 } }));
  await Promise.all(statOps);

  emitToGroup(group._id, "expense:updated", { groupId: group._id, expense: populatedExpense });
  emitToGroup(group._id, "fairness:changed", { groupId: group._id, fairness });
  emitToGroup(group._id, "split:updated", { groupId: group._id, expenseId: expense._id, participants: newShares });

  return { expense: populatedExpense, fairness };
}

async function deleteExpense(groupId, expenseId, actorId) {
  const expense = await Expense.findById(expenseId);
  if (!expense) throw new AppError("Expense not found", 404);
  if (String(expense.group) !== String(groupId)) throw new AppError("Expense does not belong to this group", 400);

  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, actorId);

  let fairness;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const freshGroup = await Group.findById(group._id).session(session);
      fairness = unapplyExpenseToGroup(freshGroup, expense);
      await freshGroup.save({ session });
      await Expense.deleteOne({ _id: expense._id }, { session });
    });
  } finally {
    await session.endSession();
  }

  // Reverse the participants' lifetime stats with best-effort updates.
  const statisticOps = expense.participants.map((participant) => (
    User.updateOne(
      { _id: participant.user },
      { $inc: { "stats.totalOwed": -participant.share } },
    )
  ));
  statisticOps.push(
    User.updateOne(
      { _id: expense.paidBy },
      {
        $inc: {
          "stats.totalPaid": -expense.amount,
          "stats.expensesCreated": -1,
        },
      },
    ),
  );
  await Promise.all(statisticOps);

  emitToGroup(group._id, "expense:deleted", { groupId: group._id, expenseId: expense._id });
  emitToGroup(group._id, "fairness:changed", { groupId: group._id, fairness });

  return { deleted: true, expenseId, fairness };
}

async function getExpenses(groupId, userId, options = {}) {
  const { limit = 25, cursor, splitType } = options;

  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 25, 10), 100);

  let query = Expense.find({ group: groupId });

  if (splitType && ['equal', 'income-based', 'usage-based', 'ai-recommended', 'custom'].includes(splitType)) {
    query.where('splitType').equals(splitType);
  }

  query
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
    `/groups/${groupId}/expenses`,
    pageLimit
  );
}

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
  deleteExpense,
  getExpenses,
  updateExpense,
};
