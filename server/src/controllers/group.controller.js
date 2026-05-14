const groupService = require("../services/group.service");
const asyncHandler = require("../utils/asyncHandler");

const createGroup = asyncHandler(async (req, res) => {
  const group = await groupService.createGroup(req.user, req.body);
  res.status(201).json({ success: true, data: { group } });
});

const getGroups = asyncHandler(async (req, res) => {
  const groups = await groupService.getGroups(req.user._id);
  res.json({ success: true, data: { groups } });
});

const getGroup = asyncHandler(async (req, res) => {
  const group = await groupService.getGroupById(req.params.id, req.user._id);
  res.json({ success: true, data: { group } });
});

const addMember = asyncHandler(async (req, res) => {
  const group = await groupService.addMember(req.params.id, req.user._id, req.body);
  res.json({ success: true, data: { group } });
});

const createDirectChat = asyncHandler(async (req, res) => {
  const group = await groupService.getOrCreateDirectChat(req.user, req.body);
  res.status(201).json({ success: true, data: { group } });
});

module.exports = { addMember, createDirectChat, createGroup, getGroup, getGroups };
