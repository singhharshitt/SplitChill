const User = require("../models/User");
const Group = require("../models/Group");
const { emitToGroup, emitToUser } = require("../socket/socketHub");

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getMe(user) {
  return user.toSafeObject();
}

async function searchUsers(query, requesterId) {
  const safeQuery = escapeRegex(query).slice(0, 80);
  const filter = query
    ? {
        _id: { $ne: requesterId },
        $or: [
          { name: { $regex: safeQuery, $options: "i" } },
          { email: { $regex: safeQuery, $options: "i" } },
          { phone: { $regex: safeQuery, $options: "i" } },
          { upi: { $regex: safeQuery, $options: "i" } },
        ],
      }
    : { _id: { $ne: requesterId } };

  return User.find(filter).select("name email phone upi income stats").limit(20).sort({ name: 1 });
}

async function updateMe(userId, payload) {
  const update = {};
  if (payload.name !== undefined) update.name = payload.name;
  if (payload.income !== undefined) update.income = payload.income;
  if (payload.phone !== undefined) update.phone = payload.phone;
  if (payload.upi !== undefined) update.upi = payload.upi;
  if (payload.preferences) {
    Object.entries(payload.preferences).forEach(([key, value]) => {
      update[`preferences.${key}`] = value;
    });
  }
  if (Object.keys(update).length === 0) {
    const existing = await User.findById(userId);
    return existing.toSafeObject();
  }

  const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true, runValidators: true });
  if (payload.income !== undefined || payload.name !== undefined) {
    const groups = await Group.find({ "members.user": userId }).select("_id");
    if (payload.income !== undefined) {
      await Group.updateMany(
        { "members.user": userId },
        { $set: { "members.$[member].incomeSnapshot": payload.income } },
        { arrayFilters: [{ "member.user": userId }] },
      );
    }
    groups.forEach((group) => emitToGroup(group._id, "group:updated", { groupId: group._id, action: "member_profile_updated", userId }));
  }

  const safeUser = user.toSafeObject();
  emitToUser(userId, "user:updated", { user: safeUser });
  return safeUser;
}

module.exports = {
  getMe,
  searchUsers,
  updateMe,
};
