const Group = require("../models/Group");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const AppError = require("../utils/appError");
const { applySettlementToGroup } = require("../utils/fairnessEngine");
const { buildUpiDeepLink } = require("./payment.service");
const { emitToGroup } = require("../socket/socketHub");
const { ensureMembership } = require("./group.service");

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
    .populate("payer", "name email")
    .populate("receiver", "name email")
    .populate("group", "name fairnessScore");

  emitToGroup(groupId, "transaction:created", { groupId, transaction: populated });
  if (fairness) emitToGroup(groupId, "fairness:changed", { groupId, fairness });
  emitToGroup(groupId, "group:updated", { groupId, action: status === "pending" ? "settlement_pending" : "settlement_completed" });

  return { transaction: populated, fairness };
}

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
    .populate("payer", "name email")
    .populate("receiver", "name email")
    .populate("group", "name fairnessScore");

  emitToGroup(group._id, "transaction:updated", { groupId: group._id, transaction: populated });
  if (fairness) emitToGroup(group._id, "fairness:changed", { groupId: group._id, fairness });
  emitToGroup(group._id, "group:updated", { groupId: group._id, action: status === "completed" ? "settlement_completed" : `settlement_${status}` });

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
  confirmPayment,
  getTransactions,
  settle,
};
