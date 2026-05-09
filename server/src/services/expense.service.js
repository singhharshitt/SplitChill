const Expense = require("../models/Expense");
const Group = require("../models/Group");
const User = require("../models/User");
const AppError = require("../utils/appError");
const { applyExpenseToGroup, calculateShares } = require("../utils/fairnessEngine");
const { emitToGroup } = require("../socket/socketHub");
const { ensureMembership } = require("./group.service");

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
    .populate("paidBy", "name email")
    .populate("participants.user", "name email");

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

async function getExpenses(groupId, userId) {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  return Expense.find({ group: groupId })
    .sort({ createdAt: -1 })
    .populate("paidBy", "name email")
    .populate("participants.user", "name email");
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
  getExpenses,
};
