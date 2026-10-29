const Group = require("../models/Group");
const Expense = require("../models/Expense");
const AppError = require("../utils/appError");
const { calculateFairness, calculateShares, roundMoney, clamp } = require("../utils/fairnessEngine");
const { ensureMembership } = require("./group.service");
const aiService = require("./ai.service");

async function getFairness(groupId, userId) {
  const group = await Group.findById(groupId).populate("members.user", "name email income");
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  const fairness = calculateFairness(group);
  const decorated = decorateFairness(group, fairness);

  // ── AI Fairness Explanation (non-blocking) ──
  try {
    const aiExplanation = await aiService.getFairnessExplanation({
      fairness,
      members: decorated.memberScores,
      groupName: group.name,
    });
    decorated.aiExplanation = aiExplanation;
  } catch {
    decorated.aiExplanation = null;
  }

  return decorated;
}

async function recommendSplit(groupId, userId, { amount, participants, splitType = "ai-recommended" }) {
  const group = await Group.findById(groupId).populate("members.user", "name email income");
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  const normalizedParticipants = normalizeParticipants(participants, group);
  assertCustomShares(amount, normalizedParticipants, splitType);

  // ── Try AI-powered recommendation first ──
  if (splitType === "ai-recommended") {
    try {
      const totalExpenses = await Expense.countDocuments({ group: groupId });
      const aiParticipants = normalizedParticipants.map((p) => {
        const member = group.members.find((m) => String(m.user?._id || m.user) === String(p.user));
        return {
          user: String(p.user),
          userName: member?.user?.name || String(p.user),
          income: member?.user?.income || member?.incomeSnapshot || 0,
          totalPaid: member?.totalPaid || 0,
          totalShare: member?.totalShare || 0,
          netBalance: member?.netBalance || 0,
        };
      });

      const aiResult = await aiService.getAiSplitRecommendation({
        amount,
        participants: aiParticipants,
        groupContext: {
          fairnessScore: group.fairnessScore,
          totalExpenses,
        },
        splitType,
      });

      if (aiResult.shares?.length) {
        const sanitized = reconcileAiShares(aiResult.shares, group, amount);
        if (sanitized) {
          return {
            splitType: "ai-recommended",
            amount,
            shares: sanitized.map((s) => ({
              ...s,
              userName: findMemberName(group, s.user),
            })),
            explanation: aiResult.explanation,
            confidence: aiResult.confidence,
            splitStrategy: aiResult.splitStrategy,
            aiModel: aiResult.model,
            projectedFairness: projectFairness(group, sanitized, amount),
          };
        }
        // AI output unusable — fall through to the deterministic engine.
      }
    } catch {
      // Fall through to engine-based recommendation
    }
  }

  // ── Fallback: fairness engine calculation ──
  const shares = calculateShares({
    amount,
    participants: normalizedParticipants,
    members: group.members,
    splitType,
  });

  return {
    splitType,
    amount,
    shares: shares.map((share) => ({
      ...share,
      userName: findMemberName(group, share.user),
    })),
    projectedFairness: projectFairness(group, shares, amount),
  };
}

function assertCustomShares(amount, participants, splitType) {
  if (splitType !== "custom") return;
  const total = participants.reduce((sum, participant) => sum + Number(participant.share || 0), 0);
  if (Math.abs(total - Number(amount)) > 0.01) {
    throw new AppError("Custom shares must add up to the expense amount", 400);
  }
}

/**
 * Sanitize and reconcile AI-generated shares so they exactly sum to the amount.
 * - drops unknown/hallucinated participant ids
 * - clamps each share to [0, amount]
 * - distributes any rounding drift so total === amount exactly (2dp)
 * Returns null when nothing usable remains.
 */
function reconcileAiShares(rawShares, group, amount) {
  const memberIds = new Set(group.members.map((m) => String(m.user?._id || m.user)));
  const numericAmount = Number(amount);

  const valid = rawShares
    .filter((share) => memberIds.has(String(share.user)))
    .filter((share) => Number.isFinite(Number(share.share)))
    .map((share) => ({
      user: String(share.user),
      reason: typeof share.reason === "string" ? share.reason.slice(0, 200) : "",
      share: roundMoney(clamp(Number(share.share), 0, numericAmount)),
    }));

  if (!valid.length) return null;

  // Distribute any remaining rounding drift onto the participants so the
  // shares reconcile exactly with the expense amount.
  let allocated = roundMoney(valid.reduce((sum, s) => sum + s.share, 0));
  let remainder = roundMoney(numericAmount - allocated);
  if (Math.abs(remainder) > 0.011) {
    // AI output drifted too far from the fair distribution — reject it so the
    // deterministic engine produces the split instead.
    return null;
  }
  if (remainder !== 0) {
    const target = valid.find((s) => s.share + remainder >= 0) || valid[0];
    target.share = roundMoney(target.share + remainder);
    remainder = 0;
  }

  return valid.map((s) => ({ ...s, share: roundMoney(Math.max(0, s.share)) }));
}

function normalizeParticipants(participants, group) {
  const groupMemberIds = new Set(group.members.map((member) => String(member.user?._id || member.user)));
  const input = participants?.length ? participants : [...groupMemberIds].map((user) => ({ user }));

  input.forEach((participant) => {
    if (!groupMemberIds.has(String(participant.user))) {
      throw new AppError("All participants must belong to the group", 400);
    }
  });

  return input;
}

function projectFairness(group, shares, amount) {
  const clone = group.toObject();
  shares.forEach((share, index) => {
    const member = clone.members.find((item) => String(item.user?._id || item.user) === String(share.user));
    if (!member) return;
    member.totalShare = (member.totalShare || 0) + share.share;
    if (index === 0) member.totalPaid = (member.totalPaid || 0) + amount;
    member.netBalance = (member.totalPaid || 0) - (member.totalShare || 0);
  });
  return calculateFairness(clone);
}

function decorateFairness(group, fairness) {
  return {
    ...fairness,
    memberScores: fairness.memberScores.map((score) => ({
      ...score,
      userName: findMemberName(group, score.user),
    })),
  };
}

function findMemberName(group, userId) {
  const member = group.members.find((item) => String(item.user?._id || item.user) === String(userId));
  return member?.user?.name || String(userId);
}

module.exports = {
  getFairness,
  recommendSplit,
};
