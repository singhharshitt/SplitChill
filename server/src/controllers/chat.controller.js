const chatService = require("../services/chat.service");
const asyncHandler = require("../utils/asyncHandler");
const { requireFields } = require("../middleware/validate");

const createMessage = asyncHandler(async (req, res) => {
  requireFields(req.body, ["text"]);
  const message = await chatService.createMessage(req.params.id, req.user._id, req.body.text, req.body.metadata);
  res.status(201).json({ success: true, data: { message } });
});

module.exports = { createMessage };
