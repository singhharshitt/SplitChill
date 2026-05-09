/**
 * Chat Service with Pagination
 * File: server/src/services/chat.service.js (UPDATED)
 */

const ChatMessage = require("../models/ChatMessage");
const Group = require("../models/Group");
const AppError = require("../utils/appError");
const { emitToGroup } = require("../socket/socketHub");
const { ensureMembership } = require("./group.service");
const { paginate, buildPaginationResponse } = require("../utils/paginationUtils");

/**
 * Create a new chat message in a group
 * @param {string} groupId - Group ID
 * @param {string} senderId - Sender user ID
 * @param {string} text - Message text
 * @param {object} metadata - Optional metadata
 * @returns {Promise<object>} Populated message document
 */
async function createMessage(groupId, senderId, text, metadata = {}) {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, senderId);

  const message = await ChatMessage.create({
    group: groupId,
    sender: senderId,
    text,
    metadata
  });

  const populated = await ChatMessage.findById(message._id)
    .populate("sender", "name email avatar");

  // Emit to all group members via WebSocket
  emitToGroup(groupId, "chat:message", { groupId, message: populated });
  
  return populated;
}

/**
 * Get paginated messages for a group (newest first)
 * Uses cursor-based pagination for infinite scroll
 * @param {string} groupId - Group ID
 * @param {string} userId - Requesting user ID
 * @param {object} options - { limit, cursor }
 * @returns {Promise<object>} { items, pagination }
 */
async function getMessages(groupId, userId, options = {}) {
  const { limit = 30, cursor } = options;

  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  // Validate limit between 10 and 100
  const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 10), 100);

  // Build base query
  const query = ChatMessage.find({ group: groupId })
    .populate("sender", "name email avatar");

  // Paginate: newest first
  const { items, hasMore, nextCursor, count } = await paginate(query, {
    limit: pageLimit,
    cursor,
    direction: 'older',
    sortOrder: -1 // descending: newest first
  });

  return buildPaginationResponse(
    items,
    nextCursor,
    `/groups/${groupId}/chat/messages`,
    pageLimit
  );
}

/**
 * Get older messages before a specific message ID
 * Useful for loading history when user scrolls up
 * @param {string} groupId - Group ID
 * @param {string} userId - Requesting user ID
 * @param {string} beforeMessageId - Message ID to fetch before
 * @param {number} limit - Number of messages to fetch
 * @returns {Promise<object>} { items, hasMore, count }
 */
async function getOlderMessages(groupId, userId, beforeMessageId, limit = 30) {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 10), 100);

  const messages = await ChatMessage.find({
    group: groupId,
    _id: { $lt: beforeMessageId }
  })
    .sort({ _id: -1 })
    .limit(pageLimit + 1)
    .populate("sender", "name email avatar")
    .lean();

  const hasMore = messages.length > pageLimit;
  const paginatedMessages = messages.slice(0, pageLimit);

  return {
    items: paginatedMessages,
    hasMore,
    count: paginatedMessages.length
  };
}

/**
 * Search messages in a group (optional advanced feature)
 * @param {string} groupId - Group ID
 * @param {string} userId - Requesting user ID
 * @param {string} searchText - Text to search for
 * @param {object} options - { limit, cursor }
 * @returns {Promise<object>} Paginated search results
 */
async function searchMessages(groupId, userId, searchText, options = {}) {
  const { limit = 20, cursor } = options;

  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);

  const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 10), 100);

  // Create text index if not exists (add to model)
  const query = ChatMessage.find(
    { group: groupId, $text: { $search: searchText } },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .populate("sender", "name email avatar");

  const { items, hasMore, nextCursor, count } = await paginate(query, {
    limit: pageLimit,
    cursor,
    sortOrder: -1
  });

  return buildPaginationResponse(
    items,
    nextCursor,
    `/groups/${groupId}/chat/messages/search?q=${encodeURIComponent(searchText)}`,
    pageLimit
  );
}

/**
 * Delete a message (soft delete)
 * @param {string} messageId - Message ID to delete
 * @param {string} userId - Requesting user ID (must be sender)
 * @returns {Promise<object>} Updated message
 */
async function deleteMessage(messageId, userId) {
  const message = await ChatMessage.findById(messageId);
  if (!message) throw new AppError("Message not found", 404);
  
  // Only sender or group admin can delete
  if (String(message.sender) !== String(userId)) {
    throw new AppError("You can only delete your own messages", 403);
  }

  // Soft delete: replace text
  message.text = "[deleted]";
  message.metadata.deletedAt = new Date();
  await message.save();

  emitToGroup(message.group, "chat:message:deleted", { messageId });
  return message;
}

/**
 * Edit a message
 * @param {string} messageId - Message ID to edit
 * @param {string} userId - Requesting user ID (must be sender)
 * @param {string} newText - New message text
 * @returns {Promise<object>} Updated message
 */
async function editMessage(messageId, userId, newText) {
  const message = await ChatMessage.findById(messageId);
  if (!message) throw new AppError("Message not found", 404);

  if (String(message.sender) !== String(userId)) {
    throw new AppError("You can only edit your own messages", 403);
  }

  // Mark as edited
  message.text = newText;
  message.metadata.editedAt = new Date();
  await message.save();

  const populated = await ChatMessage.findById(messageId)
    .populate("sender", "name email avatar");

  emitToGroup(message.group, "chat:message:edited", { message: populated });
  return populated;
}

module.exports = {
  createMessage,
  getMessages,
  getOlderMessages,
  searchMessages,
  deleteMessage,
  editMessage
};
