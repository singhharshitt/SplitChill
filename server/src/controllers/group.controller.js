const groupService = require("../services/group.service");
const asyncHandler = require("../utils/asyncHandler");
const { requireFields } = require("../middleware/validate");

const createGroup = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name"]);
  const group = await groupService.createGroup(req.user, req.body);
  res.status(201).json({ success: true, data: { group } });
});

const getGroup = asyncHandler(async (req, res) => {
  const group = await groupService.getGroupById(req.params.id, req.user._id);
  res.json({ success: true, data: { group } });
});

const addMember = asyncHandler(async (req, res) => {
  requireFields(req.body, ["userId"]);
  const group = await groupService.addMember(req.params.id, req.user._id, req.body);
  res.json({ success: true, data: { group } });
});

module.exports = { addMember, createGroup, getGroup };
