const Expense = require("../models/Expense");
const Group = require("../models/Group");
const Transaction = require("../models/Transaction");
const AppError = require("../utils/appError");
const { ensureMembership } = require("./group.service");
const { roundMoney } = require("../utils/fairnessEngine");

async function getAnalytics(groupId, userId) {
  const group = await Group.findById(groupId).populate("members.user", "name email");
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  const [expenses, transactions] = await Promise.all([
    Expense.find({ group: groupId }).sort({ createdAt: 1 }),
    Transaction.find({ group: groupId, status: "completed" }),
  ]);

  const paymentVsUsage = group.members.map((member) => ({
    user: member.user._id,
    name: member.user.name,
    paid: roundMoney(member.totalPaid || 0),
    share: roundMoney(member.totalShare || 0),
    netBalance: roundMoney(member.netBalance || 0),
    contributionRatio: roundMoney((member.totalPaid || 0) / Math.max(member.totalShare || 1, 1)),
  }));

  const fairnessTrend = group.fairnessHistory.map((item) => ({
    score: item.score,
    imbalance: item.imbalance,
    at: item.calculatedAt,
  }));

  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const settlementVolume = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const imbalance = paymentVsUsage.reduce((sum, member) => sum + Math.abs(member.netBalance), 0) / 2;
  const groupHealthScore = Math.round(Math.max(0, Math.min(100, group.fairnessScore - (imbalance / Math.max(totalExpense, 1)) * 20)));

  return {
    totals: {
      expenses: roundMoney(totalExpense),
      settlements: roundMoney(settlementVolume),
      imbalance: roundMoney(imbalance),
    },
    paymentVsUsage,
    contributionImbalance: paymentVsUsage.sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance)),
    fairnessTrend,
    groupHealthScore,
    expenseVelocity: buildExpenseVelocity(expenses),
  };
}

function buildExpenseVelocity(expenses) {
  const buckets = new Map();
  expenses.forEach((expense) => {
    const key = expense.createdAt.toISOString().slice(0, 10);
    buckets.set(key, roundMoney((buckets.get(key) || 0) + expense.amount));
  });

  return [...buckets.entries()].map(([date, amount]) => ({ date, amount }));
}

module.exports = { getAnalytics };
