const Group = require("../models/Group");
const AppError = require("../utils/appError");
const { ensureMembership } = require("./group.service");
const { roundMoney } = require("../utils/fairnessEngine");

async function getSuggestions(groupId, userId) {
  const group = await Group.findById(groupId).populate("members.user", "name email");
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  const creditors = group.members
    .filter((member) => (member.netBalance || 0) > 0)
    .sort((a, b) => b.netBalance - a.netBalance);
  const debtors = group.members
    .filter((member) => (member.netBalance || 0) < 0)
    .sort((a, b) => a.netBalance - b.netBalance);

  const settlements = buildSettlementPlan(debtors, creditors);
  const nextPayer = pickNextPayer(group.members);
  const suggestedSplitType = group.fairnessScore < 75 ? "ai-recommended" : "equal";

  return {
    nextPayer: nextPayer ? {
      user: nextPayer.user._id,
      name: nextPayer.user.name,
      reason: `${nextPayer.user.name} should pay next to reduce current contribution imbalance.`,
    } : null,
    suggestedSplitType,
    expectedImbalance: roundMoney(group.members.reduce((sum, member) => sum + Math.abs(member.netBalance || 0), 0) / 2),
    suggestions: settlements.map((item) => ({
      ...item,
      message: `${item.payerName} should settle ₹${item.amount} with ${item.receiverName}`,
    })),
  };
}

function pickNextPayer(members) {
  return [...members]
    .sort((a, b) => {
      const aPressure = (a.netBalance || 0) - (a.underpaymentStreak || 0) * 100;
      const bPressure = (b.netBalance || 0) - (b.underpaymentStreak || 0) * 100;
      return aPressure - bPressure;
    })[0];
}

function buildSettlementPlan(debtors, creditors) {
  const plan = [];
  const debtQueue = debtors.map((member) => ({ member, amount: Math.abs(member.netBalance || 0) }));
  const creditQueue = creditors.map((member) => ({ member, amount: member.netBalance || 0 }));

  while (debtQueue.length && creditQueue.length) {
    const debtor = debtQueue[0];
    const creditor = creditQueue[0];
    const amount = roundMoney(Math.min(debtor.amount, creditor.amount));

    if (amount > 0) {
      plan.push({
        payer: debtor.member.user._id,
        payerName: debtor.member.user.name,
        receiver: creditor.member.user._id,
        receiverName: creditor.member.user.name,
        amount,
      });
    }

    debtor.amount = roundMoney(debtor.amount - amount);
    creditor.amount = roundMoney(creditor.amount - amount);
    if (debtor.amount <= 0) debtQueue.shift();
    if (creditor.amount <= 0) creditQueue.shift();
  }

  return plan;
}

module.exports = { getSuggestions };
