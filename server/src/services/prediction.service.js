const Group = require("../models/Group");
const Expense = require("../models/Expense");
const AppError = require("../utils/appError");
const { ensureMembership } = require("./group.service");
const { roundMoney } = require("../utils/fairnessEngine");
const aiService = require("./ai.service");

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

  const engineResult = {
    nextPayer: nextPayer ? {
      user: nextPayer.user._id,
      name: nextPayer.user.name,
      reason: `${nextPayer.user.name} should pay next to reduce current contribution imbalance.`,
    } : null,
    suggestedSplitType,
    expectedImbalance: roundMoney(group.members.reduce((sum, member) => sum + Math.abs(member.netBalance || 0), 0) / 2),
    suggestions: settlements.map((item) => ({
      ...item,
      // These come from stored balances (historical facts), not AI speculation.
      source: "historical-calculation",
      message: `${item.payerName} should settle ₹${item.amount} with ${item.receiverName}`,
    })),
  };

  // ── AI-enhanced predictions (only when there is history to ground them) ──
  try {
    const recentExpenses = await Expense.find({ group: groupId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title amount")
      .lean();

    if (!recentExpenses.length) {
      // Not enough history — degrade gracefully instead of letting the model
      // invent financial facts.
      engineResult.aiPredictions = {
        items: [],
        insufficientData: true,
        message: "Not enough expense history yet — predictions will appear after a few expenses.",
      };
      return engineResult;
    }

    const aiPredictions = await aiService.getAiPredictions({
      members: group.members.map((m) => ({
        userName: m.user?.name || "Member",
        netBalance: m.netBalance || 0,
      })),
      expenses: recentExpenses,
      fairnessScore: group.fairnessScore,
      groupName: group.name,
    });

    // Normalize AI output into a single shape and mark it as speculative so
    // the UI can present it differently from the historical balance math.
    if (Array.isArray(aiPredictions?.predictions) && aiPredictions.predictions.length) {
      engineResult.aiPredictions = {
        items: aiPredictions.predictions.map((item) => ({
          source: "ai-recommendation",
          ...(item.title || item.text || item.message ? item : {}),
        })),
        trendInsight: aiPredictions.trendInsight || "",
        insufficientData: false,
      };
      return engineResult;
    }

    engineResult.aiPredictions = { items: [], insufficientData: false, message: "AI predictions unavailable right now." };
  } catch {
    engineResult.aiPredictions = null;
  }

  return engineResult;
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
