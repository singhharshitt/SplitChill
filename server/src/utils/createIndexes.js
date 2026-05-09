/**
 * MongoDB Index Setup for Pagination Optimization
 */

const ChatMessage = require("../models/ChatMessage");
const Expense = require("../models/Expense");
const Transaction = require("../models/Transaction");
const Group = require("../models/Group");
const Payment = require("../models/Payment");
const PaymentEvent = require("../models/PaymentEvent");
const SmsLog = require("../models/SmsLog");
const WebhookLog = require("../models/WebhookLog");
const AuditLog = require("../models/AuditLog");

function normalizeIndexKey(key = {}) {
  return JSON.stringify(Object.entries(key));
}

function isExistingIndexConflict(error) {
  return error?.code === 85 || error?.codeName === "IndexOptionsConflict";
}

async function ensureIndex(collection, key, options = {}, successMessage = "") {
  try {
    await collection.createIndex(key, options);
  } catch (error) {
    if (!isExistingIndexConflict(error)) throw error;

    const indexes = await collection.indexes();
    const existing = indexes.find((index) => normalizeIndexKey(index.key) === normalizeIndexKey(key));
    if (!existing) throw error;
  }

  if (successMessage) console.log(successMessage);
}

async function createIndexes() {
  try {
    console.log("Creating database indexes...");

    await ensureIndex(ChatMessage.collection, { group: 1, createdAt: -1 }, { background: true, name: "group_createdAt_desc" }, "✓ ChatMessage: group + createdAt");
    await ensureIndex(ChatMessage.collection, { group: 1, _id: -1 }, { background: true, name: "group_id_desc" }, "✓ ChatMessage: group + _id");
    await ensureIndex(ChatMessage.collection, { text: "text", group: 1 }, { background: true, name: "text_search" }, "✓ ChatMessage: text search");

    await ensureIndex(Expense.collection, { group: 1, createdAt: -1 }, { background: true, name: "group_createdAt_desc" }, "✓ Expense: group + createdAt");
    await ensureIndex(Expense.collection, { group: 1, _id: -1 }, { background: true, name: "group_id_desc" }, "✓ Expense: group + _id");
    await ensureIndex(Expense.collection, { paidBy: 1, createdAt: -1 }, { background: true, name: "paidBy_createdAt_desc" }, "✓ Expense: paidBy + createdAt");
    await ensureIndex(Expense.collection, { group: 1, splitType: 1, createdAt: -1 }, { background: true, name: "group_splitType_createdAt_desc" }, "✓ Expense: group + splitType + createdAt");

    await ensureIndex(Transaction.collection, { group: 1, createdAt: -1 }, { background: true, name: "group_createdAt_desc" }, "✓ Transaction: group + createdAt");
    await ensureIndex(Transaction.collection, { group: 1, _id: -1 }, { background: true, name: "group_id_desc" }, "✓ Transaction: group + _id");
    await ensureIndex(Transaction.collection, { group: 1, status: 1, createdAt: -1 }, { background: true, name: "group_status_createdAt_desc" }, "✓ Transaction: group + status + createdAt");
    await ensureIndex(Transaction.collection, { group: 1, payer: 1, createdAt: -1 }, { background: true, name: "group_payer_createdAt_desc" }, "✓ Transaction: group + payer + createdAt");
    await ensureIndex(Transaction.collection, { group: 1, receiver: 1, createdAt: -1 }, { background: true, name: "group_receiver_createdAt_desc" }, "✓ Transaction: group + receiver + createdAt");
    await ensureIndex(Transaction.collection, { payer: 1, createdAt: -1 }, { background: true, name: "payer_createdAt_desc" }, "✓ Transaction: payer + createdAt");
    await ensureIndex(Transaction.collection, { receiver: 1, createdAt: -1 }, { background: true, name: "receiver_createdAt_desc" }, "✓ Transaction: receiver + createdAt");
    await ensureIndex(Transaction.collection, { status: 1, payer: 1, createdAt: -1 }, { background: true, name: "status_payer_createdAt_desc" }, "✓ Transaction: status + payer + createdAt");
    await ensureIndex(Transaction.collection, { status: 1, receiver: 1, createdAt: -1 }, { background: true, name: "status_receiver_createdAt_desc" }, "✓ Transaction: status + receiver + createdAt");

    await ensureIndex(Payment.collection, { idempotencyKey: 1 }, { background: true, unique: true, name: "idempotency_unique" });
    await ensureIndex(Payment.collection, { group: 1, createdAt: -1 }, { background: true, name: "payment_group_createdAt_desc" });
    await ensureIndex(Payment.collection, { status: 1, nextRetryAt: 1 }, { background: true, name: "payment_retry_due" });
    console.log("✓ Payment: idempotency, group pagination, retry");

    await ensureIndex(PaymentEvent.collection, { provider: 1, providerEventId: 1 }, { background: true, unique: true, name: "provider_event_unique" });
    await ensureIndex(PaymentEvent.collection, { group: 1, createdAt: -1 }, { background: true, name: "payment_event_group_createdAt_desc" });
    console.log("✓ PaymentEvent: provider event uniqueness + pagination");

    await ensureIndex(SmsLog.collection, { status: 1, nextRetryAt: 1 }, { background: true, name: "sms_retry_due" });
    await ensureIndex(SmsLog.collection, { createdAt: -1 }, { background: true, name: "sms_createdAt_desc" });
    console.log("✓ SmsLog: retry + createdAt");

    await ensureIndex(WebhookLog.collection, { provider: 1, eventId: 1 }, { background: true, unique: true, name: "webhook_provider_event_unique" });
    await ensureIndex(AuditLog.collection, { resourceType: 1, resourceId: 1, createdAt: -1 }, { background: true, name: "audit_resource_createdAt_desc" });
    console.log("✓ WebhookLog/AuditLog: lookup indexes");

    await ensureIndex(Group.collection, { "members.user": 1 }, { background: true, name: "members_user" }, "✓ Group: members.user");
    await ensureIndex(Group.collection, { owner: 1, updatedAt: -1 }, { background: true, name: "owner_updatedAt_desc" }, "✓ Group: owner + updatedAt");

    console.log("\n✓ All indexes created successfully!");
    console.log("Note: indexes are created in background where supported.\n");
  } catch (error) {
    console.error("Error creating indexes:", error);
    throw error;
  }
}

async function dropAllIndexes() {
  try {
    console.warn("Dropping all indexes...");
    await Promise.all([
      ChatMessage.collection.dropAllIndexes(),
      Expense.collection.dropAllIndexes(),
      Transaction.collection.dropAllIndexes(),
    ]);
    console.log("✓ All indexes dropped");
  } catch (error) {
    console.error("Error dropping indexes:", error);
  }
}

async function getIndexStats() {
  try {
    const stats = await Promise.all([
      ChatMessage.collection.getIndexes(),
      Expense.collection.getIndexes(),
      Transaction.collection.getIndexes(),
    ]);

    console.log("\nIndex Statistics:\n");
    console.log("ChatMessage indexes:", Object.keys(stats[0]));
    console.log("Expense indexes:", Object.keys(stats[1]));
    console.log("Transaction indexes:", Object.keys(stats[2]));
  } catch (error) {
    console.error("Error getting index stats:", error);
  }
}

module.exports = {
  createIndexes,
  dropAllIndexes,
  getIndexStats,
};
