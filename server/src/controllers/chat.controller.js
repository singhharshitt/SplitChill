const chatService = require("../services/chat.service");
const asyncHandler = require("../utils/asyncHandler");

const createMessage = asyncHandler(async (req, res) => {
  const message = await chatService.createMessage(req.params.id, req.user._id, req.body.text, req.body.metadata);
  res.status(201).json({ success: true, data: { message } });
});

const getMessages = asyncHandler(async (req, res) => {
  const messages = await chatService.getMessages(req.params.id, req.user._id);
  res.json({ success: true, data: { messages } });
});

module.exports = { createMessage, getMessages };
