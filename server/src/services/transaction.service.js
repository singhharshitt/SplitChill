const mongoose = require("mongoose");
const Group = require("../models/Group");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const AppError = require("../utils/appError");
const { applySettlementToGroup, roundMoney } = require("../utils/fairnessEngine");
const { buildUpiIntent, buildUpiQrDataUrl, assertValidUpiId } = require("./upi.service");
const { emitToGroup } = require("../socket/socketHub");
const { ensureMembership } = require("./group.service");
const { paginate, buildPaginationResponse } = require("../utils/paginationUtils");

const EPSILON = 0.011; // tolerate 1-paisa rounding drift

function idOf(value) {
  return String(value?._id || value);
}

/**
 * Outstanding debt from `debtorId` to `creditorId` in a group,
 * computed from authoritative backend balances (never client input).
 */
function outstandingDebt(group, debtorId, creditorId) {
  const debtor = group.members.find((member) => idOf(member.user) === String(debtorId));
  const creditor = group.members.find((member) => idOf(member.user) === String(creditorId));
  const owes = roundMoney(-(debtor?.netBalance || 0));
  const credit = roundMoney(creditor?.netBalance || 0);
  return roundMoney(Math.max(0, Math.min(owes, credit)));
}

/**
 * Permitted status transitions for a settlement.
 * pending / reported_paid → recipient_confirmed (receiver confirms receipt)
 * pending / reported_paid → cancelled (either participant)
 */
const TRANSITION_MAP = {
  report_paid: { from: ["pending", "reported_paid"], to: "reported_paid" },
  confirm: { from: ["pending", "reported_paid"], to: "recipient_confirmed" },
  cancel: { from: ["pending", "reported_paid"], to: "cancelled" },
};

async function settle(actorId, { groupId, payer, receiver, amount, note, receiverUpiId } = {}) {
  const group = await Group.findById(groupId).populate("members.user", "name email upi");
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

  const numericAmount = roundMoney(Number(amount));
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new AppError("Settlement amount must be a positive number", 400);
  }

  // Recompute the real debt on the server; reject overpaying a non-existent debt.
  const debt = outstandingDebt(group, payer, receiver);
  if (debt <= 0) {
    throw new AppError("There is no outstanding debt from this payer to this receiver in the group", 400);
  }
  if (numericAmount > debt + EPSILON) {
    throw new AppError(`Amount exceeds the outstanding debt of ₹${debt.toFixed(2)}`, 400);
  }

  // Receiving member record (populated above).
  const receiverMember = group.members.find((member) => idOf(member.user) === String(receiver));
  const receiverUser = receiverMember?.user;
  if (!receiverUser) throw new AppError("Receiver not found", 404);

  // The payee UPI ID: explicit request value (validated) or the receiver's saved UPI ID.
  // A UPI ID is user-provided destination info only; the payer reviews it before paying.
  let payeeVpa;
  if (receiverUpiId) {
    payeeVpa = assertValidUpiId(receiverUpiId);
  } else if (receiverUser.upi) {
    payeeVpa = assertValidUpiId(receiverUser.upi);
  }

  const hasUpi = Boolean(payeeVpa);
  const transaction = await Transaction.create({
    group: String(group._id),
    payer: String(payer),
    receiver: String(receiver),
    amount: numericAmount,
    note,
    status: hasUpi ? "pending" : "completed",
    paymentMethod: hasUpi ? "upi" : "manual",
  });

  if (!hasUpi) {
    // Manual settlement without UPI: mark participant-derived completion metadata.
    transaction.upi = { initiatedAt: new Date(), confirmedAt: new Date() };
    await transaction.save();
  }

  let fairness = null;
  let upi = null;
  if (hasUpi) {
    upi = {
      payeeVpa,
      payeeName: receiverUser.name,
      deepLink: null,
      qrDataUrl: null,
      initiatedAt: new Date(),
    };
    try {
      upi.deepLink = buildUpiIntent({
        payeeVpa,
        payeeName: receiverUser.name,
        amount: numericAmount,
        note: note || `SplitChill settlement — ${group.name}`,
        transactionId: transaction._id,
      });
      upi.qrDataUrl = await buildUpiQrDataUrl(upi.deepLink);
      transaction.upi = upi;
      await transaction.save();
    } catch {
      // QR generation must never block settlement creation.
      transaction.upi = upi;
      await transaction.save();
    }
  } else {
    // ── Manual settlement completes immediately, atomically ──
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        fairness = applySettlementToGroup(group, transaction);
        await group.save({ session });
        await User.updateOne({ _id: transaction.payer }, { $inc: { "stats.settlementsMade": 1 } }, { session, upsert: false });
        await User.updateOne({ _id: transaction.receiver }, { $inc: { "stats.settlementsReceived": 1 } }, { session, upsert: false });
      });
    } finally {
      await session.endSession();
    }
  }

  const populated = await Transaction.findById(transaction._id)
    .populate("payer", "name email avatar")
    .populate("receiver", "name email avatar")
    .populate("group", "name fairnessScore");

  emitToGroup(String(groupId), "transaction:created", { groupId: String(groupId), transaction: populated });
  if (fairness) emitToGroup(String(groupId), "fairness:changed", { groupId: String(groupId), fairness });
  const settled = fairness !== null;
  emitToGroup(String(groupId), "group:updated", { groupId: String(groupId), action: settled ? "settlement_completed" : "settlement_pending" });

  return {
    transaction: populated,
    fairness,
    // Payer-facing UPI payment details (only when the receiver has a saved UPI ID).
    payment: upi ? {
      payeeVpa,
      payeeName: receiverUser.name,
      amount: numericAmount,
      deepLink: upi.deepLink,
      qrDataUrl: upi.qrDataUrl,
      disclaimer: "SplitChill cannot see whether a UPI transfer actually succeeded. The receiver must confirm receipt.",
    } : null,
  };
}

/**
 * Payer reports that they sent the money via UPI.
 * Status becomes reported_paid — this is the PAYER's claim only, never proof.
 */
async function reportPaid(actorId, transactionId, { providerReference } = {}) {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw new AppError("Transaction not found", 404);
  const group = await Group.findById(transaction.group);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, actorId);
  if (idOf(transaction.payer) !== String(actorId)) {
    throw new AppError("Only the payer can report a payment", 403);
  }
  assertTransition(transaction, "report_paid");

  transaction.status = "reported_paid";
  if (!transaction.upi) transaction.upi = {};
  transaction.upi.reportedAt = new Date();
  if (providerReference) transaction.upi.providerReference = String(providerReference).slice(0, 120);
  await transaction.save();

  const populated = await Transaction.findById(transaction._id)
    .populate("payer", "name email avatar")
    .populate("receiver", "name email avatar")
    .populate("group", "name fairnessScore");

  emitToGroup(String(group._id), "transaction:updated", { groupId: String(group._id), transaction: populated });
  emitToGroup(String(group._id), "group:updated", { groupId: String(group._id), action: "settlement_reported_paid" });

  return { transaction: populated };
}

/**
 * Receiver confirms receipt of the money. This is the ONLY transition that
 * settles balances, applied exactly once via a MongoDB transaction.
 */
async function confirmSettlement(actorId, transactionId, { providerReference } = {}) {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw new AppError("Transaction not found", 404);
  const group = await Group.findById(transaction.group);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, actorId);
  if (idOf(transaction.receiver) !== String(actorId)) {
    throw new AppError("Only the receiver can confirm receipt of this settlement", 403);
  }
  assertTransition(transaction, "confirm");

  if (!transaction.upi) transaction.upi = {};
  if (providerReference) transaction.upi.providerReference = String(providerReference).slice(0, 120);

  transaction.status = "recipient_confirmed";
  transaction.upi.confirmedAt = new Date();

  // ── Apply settlement exactly once, atomically ──
  let fairness = null;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Re-verify inside the session that the settlement has not been applied already.
      const fresh = await Transaction.findById(transaction._id).session(session);
      if (["completed", "recipient_confirmed"].includes(fresh.status)) {
        throw new AppError("This settlement has already been confirmed", 409);
      }

      fairness = applySettlementToGroup(group, transaction);
      await group.save({ session });
      await transaction.save({ session });
      await User.updateOne({ _id: transaction.payer }, { $inc: { "stats.settlementsMade": 1 } }, { session, upsert: false });
      await User.updateOne({ _id: transaction.receiver }, { $inc: { "stats.settlementsReceived": 1 } }, { session, upsert: false });
    });
  } finally {
    await session.endSession();
  }

  const populated = await Transaction.findById(transaction._id)
    .populate("payer", "name email avatar")
    .populate("receiver", "name email avatar")
    .populate("group", "name fairnessScore");

  emitToGroup(String(group._id), "transaction:updated", { groupId: String(group._id), transaction: populated });
  if (fairness) emitToGroup(String(group._id), "fairness:changed", { groupId: String(group._id), fairness });
  emitToGroup(String(group._id), "group:updated", { groupId: String(group._id), action: "settlement_confirmed" });

  return { transaction: populated, fairness };
}

/**
 * Cancel a not-yet-confirmed settlement. Allowed for either participant
 * while the settlement is pending or merely reported_paid.
 */
async function cancelSettlement(actorId, transactionId, { reason } = {}) {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw new AppError("Transaction not found", 404);
  const group = await Group.findById(transaction.group);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, actorId);

  const isParticipant = [idOf(transaction.payer), idOf(transaction.receiver)].includes(String(actorId));
  if (!isParticipant) throw new AppError("Only settlement participants can cancel", 403);
  assertTransition(transaction, "cancel");

  transaction.status = "cancelled";
  if (!transaction.upi) transaction.upi = {};
  if (reason) {
    const previousNote = transaction.note ? `${transaction.note}; ` : "";
    transaction.note = `${previousNote}Cancelled: ${String(reason).slice(0, 200)}`.slice(0, 240);
  }
  await transaction.save();

  const populated = await Transaction.findById(transaction._id)
    .populate("payer", "name email avatar")
    .populate("receiver", "name email avatar")
    .populate("group", "name fairnessScore");

  emitToGroup(String(group._id), "transaction:updated", { groupId: String(group._id), transaction: populated });
  emitToGroup(String(group._id), "group:updated", { groupId: String(group._id), action: "settlement_cancelled" });

  return { transaction: populated };
}

function assertTransition(transaction, action) {
  const rule = TRANSITION_MAP[action];
  if (!rule.from.includes(transaction.status)) {
    throw new AppError(`Cannot ${action.replace("_", " ")} a settlement that is ${transaction.status}`, 409);
  }
}

async function getTransactions(userId, options = {}) {
  const { groupId, limit = 20, cursor, status } = options;

  const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 10), 100);

  let query;
  if (groupId) {
    const group = await Group.findById(groupId);
    if (!group) throw new AppError("Group not found", 404);
    ensureMembership(group, userId);
    query = Transaction.find({ group: groupId });
  } else {
    query = Transaction.find({
      $or: [{ payer: userId }, { receiver: userId }],
    });
  }

  if (status && ["pending", "reported_paid", "recipient_confirmed", "completed", "cancelled", "failed"].includes(status)) {
    query.where("status").equals(status);
  }

  query
    .populate("payer", "name email avatar")
    .populate("receiver", "name email avatar")
    .populate("group", "name");

  const { items, nextCursor } = await paginate(query, {
    limit: pageLimit,
    cursor,
    sortOrder: -1,
  });

  const endpoint = groupId ? `/transactions?groupId=${groupId}` : `/transactions`;
  return buildPaginationResponse(items, nextCursor, endpoint, pageLimit);
}

module.exports = {
  cancelSettlement,
  confirmSettlement,
  getTransactions,
  outstandingDebt,
  reportPaid,
  settle,
};
