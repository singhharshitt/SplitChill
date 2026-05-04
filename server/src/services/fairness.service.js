const Group = require("../models/Group");
const AppError = require("../utils/appError");
const { calculateFairness, calculateShares } = require("../utils/fairnessEngine");
const { ensureMembership } = require("./group.service");

async function getFairness(groupId, userId) {
  const group = await Group.findById(groupId).populate("members.user", "name email income");
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  const fairness = calculateFairness(group);
  return decorateFairness(group, fairness);
}

async function recommendSplit(groupId, userId, { amount, participants, splitType = "ai-recommended" }) {
  const group = await Group.findById(groupId).populate("members.user", "name email income");
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  const normalizedParticipants = normalizeParticipants(participants, group);
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
