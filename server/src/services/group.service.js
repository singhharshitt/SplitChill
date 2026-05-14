const Group = require("../models/Group");
const User = require("../models/User");
const AppError = require("../utils/appError");
const { emitToGroup } = require("../socket/socketHub");

function toMember(user, role = "member") {
  return {
    user: user._id,
    role,
    incomeSnapshot: user.income || 0,
    participationScore: user.stats?.participationScore || 1,
    paymentConsistency: user.stats?.paymentConsistency || 1,
  };
}

async function createGroup(owner, { name, type = "general", memberIds = [] }) {
  const uniqueIds = [...new Set([owner._id.toString(), ...memberIds.map(String)])];
  const users = await User.find({ _id: { $in: uniqueIds } });

  if (users.length !== uniqueIds.length) {
    throw new AppError("One or more members were not found", 404);
  }

  const group = await Group.create({
    name,
    type,
    owner: owner._id,
    members: users.map((user) => toMember(user, user._id.equals(owner._id) ? "owner" : "member")),
    fairnessHistory: [{ score: 100, imbalance: 0, calculatedAt: new Date() }],
  });

  return getGroupById(group._id, owner._id);
}

async function getGroupById(groupId, userId) {
  const group = await Group.findById(groupId)
    .populate("owner", "name email income")
    .populate("members.user", "name email income stats");

  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, userId);
  return group;
}

async function getGroups(userId) {
  return Group.find({ "members.user": userId })
    .sort({ updatedAt: -1 })
    .populate("owner", "name email income")
    .populate("members.user", "name email income stats");
}

async function addMember(groupId, actorId, { userId }) {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, actorId);

  const exists = group.members.some((member) => String(member.user) === String(userId));
  if (exists) throw new AppError("User is already a group member", 409);

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  group.members.push(toMember(user));
  await group.save();

  emitToGroup(group._id, "group:updated", { groupId: group._id, action: "member_added", userId });
  return getGroupById(group._id, actorId);
}

async function getOrCreateDirectChat(actor, { email }) {
  const otherUser = await User.findOne({ email: String(email).toLowerCase() });
  if (!otherUser) throw new AppError("No registered SplitChill user found for that email", 404);
  if (String(otherUser._id) === String(actor._id)) throw new AppError("Use a different user's email to start a direct chat", 400);

  const ids = [String(actor._id), String(otherUser._id)].sort();
  const directKey = ids.join(":");
  let group = await Group.findOne({ directKey });

  if (!group) {
    group = await Group.create({
      name: `${actor.name} & ${otherUser.name}`,
      type: "direct",
      directKey,
      owner: actor._id,
      members: [
        toMember(actor, "owner"),
        toMember(otherUser, "member"),
      ],
      fairnessHistory: [{ score: 100, imbalance: 0, calculatedAt: new Date() }],
    });
  }

  return getGroupById(group._id, actor._id);
}

function ensureMembership(group, userId) {
  const isMember = group.members.some((member) => String(member.user?._id || member.user) === String(userId));
  if (!isMember) throw new AppError("You do not have access to this group", 403);
}

module.exports = {
  addMember,
  createGroup,
  ensureMembership,
  getOrCreateDirectChat,
  getGroupById,
  getGroups,
};
