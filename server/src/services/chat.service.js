const ChatMessage = require("../models/ChatMessage");
const Group = require("../models/Group");
const AppError = require("../utils/appError");
const { emitToGroup } = require("../socket/socketHub");
const { ensureMembership } = require("./group.service");
const { paginate, buildPaginationResponse } = require("../utils/paginationUtils");

async function createMessage(groupId, senderId, text, metadata = {}) {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, senderId);

  const message = await ChatMessage.create({ group: groupId, sender: senderId, text, metadata });
  const populated = await ChatMessage.findById(message._id).populate("sender", "name email avatar");

  emitToGroup(groupId, "chat:message", { groupId, message: populated });
  return populated;
}

async function getMessages(groupId, userId, options = {}) {
  const { limit = 30, cursor } = options;

  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 10), 100);

  const query = ChatMessage.find({ group: groupId })
    .populate("sender", "name email avatar");

  const { items, hasMore, nextCursor, count } = await paginate(query, {
    limit: pageLimit,
    cursor,
    direction: 'older',
    sortOrder: -1
  });

  return buildPaginationResponse(
    items,
    nextCursor,
    `/groups/${groupId}/chat/messages`,
    pageLimit
  );
}

/**
 * Fetch messages created after a given timestamp for reconnection recovery.
 * Capped at 100 messages to prevent abuse.
 */
async function getMessagesSince(groupId, userId, since) {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  const sinceDate = new Date(since);
  if (Number.isNaN(sinceDate.getTime())) throw new AppError("Invalid since timestamp", 400);

  const messages = await ChatMessage.find({
    group: groupId,
    createdAt: { $gt: sinceDate },
  })
    .sort({ createdAt: 1 })
    .limit(100)
    .populate("sender", "name email avatar");

  return messages;
}

module.exports = { createMessage, getMessages, getMessagesSince };
