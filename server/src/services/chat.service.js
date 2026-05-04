const ChatMessage = require("../models/ChatMessage");
const Group = require("../models/Group");
const AppError = require("../utils/appError");
const { emitToGroup } = require("../socket/socketHub");
const { ensureMembership } = require("./group.service");

async function createMessage(groupId, senderId, text, metadata = {}) {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, senderId);

  const message = await ChatMessage.create({ group: groupId, sender: senderId, text, metadata });
  const populated = await ChatMessage.findById(message._id).populate("sender", "name email");

  emitToGroup(groupId, "chat:message", { groupId, message: populated });
  return populated;
}

module.exports = { createMessage };
