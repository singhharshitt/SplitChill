const User = require("../models/User");

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
        ],
      }
    : { _id: { $ne: requesterId } };

  return User.find(filter).select("name email income stats").limit(20).sort({ name: 1 });
}

module.exports = {
  getMe,
  searchUsers,
};
