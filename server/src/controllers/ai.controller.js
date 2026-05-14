const aiService = require("../services/ai.service");
const groupService = require("../services/group.service");
const Transaction = require("../models/Transaction");
const asyncHandler = require("../utils/asyncHandler");

const chat = asyncHandler(async (req, res) => {
  const [groups, transactions] = await Promise.all([
    groupService.getGroups(req.user._id),
    Transaction.find({ $or: [{ payer: req.user._id }, { receiver: req.user._id }] })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("group", "name fairnessScore")
      .lean(),
  ]);

  const reply = await aiService.getAppAssistantReply({
    message: req.body.message,
    page: req.body.context?.page,
    user: req.user,
    groups,
    transactions,
  });

  res.json({ success: true, data: { reply } });
});

module.exports = { chat };
