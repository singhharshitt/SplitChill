const Group = require("../models/Group");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const AppError = require("../utils/appError");
const { applySettlementToGroup } = require("../utils/fairnessEngine");
const { emitToGroup } = require("../socket/socketHub");
const { ensureMembership } = require("./group.service");

async function settle(actorId, { groupId, payer, receiver, amount, note }) {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, actorId);
  ensureMembership(group, payer);
  ensureMembership(group, receiver);

  const transaction = await Transaction.create({
    group: groupId,
    payer,
    receiver,
    amount,
    note,
    status: "completed",
  });

  const fairness = applySettlementToGroup(group, transaction);
  await Promise.all([
    group.save(),
    User.updateOne({ _id: payer }, { $inc: { "stats.settlementsMade": 1 } }),
    User.updateOne({ _id: receiver }, { $inc: { "stats.settlementsReceived": 1 } }),
  ]);

  const populated = await Transaction.findById(transaction._id)
    .populate("payer", "name email")
    .populate("receiver", "name email")
    .populate("group", "name fairnessScore");

  emitToGroup(groupId, "fairness:changed", { groupId, fairness });
  emitToGroup(groupId, "group:updated", { groupId, action: "settlement_completed" });

  return { transaction: populated, fairness };
}

async function getTransactions(userId, groupId) {
  const query = groupId
    ? { group: groupId }
    : { $or: [{ payer: userId }, { receiver: userId }] };

  if (groupId) {
    const group = await Group.findById(groupId);
    if (!group) throw new AppError("Group not found", 404);
    ensureMembership(group, userId);
  }

  return Transaction.find(query)
    .sort({ createdAt: -1 })
    .populate("payer", "name email")
    .populate("receiver", "name email")
    .populate("group", "name fairnessScore");
}

module.exports = {
  getTransactions,
  settle,
};
