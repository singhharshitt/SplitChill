const User = require("../models/User");

async function getMe(user) {
  return user.toSafeObject();
}

async function searchUsers(query, requesterId) {
  const filter = query
    ? {
        _id: { $ne: requesterId },
        $or: [
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      }
    : { _id: { $ne: requesterId } };

  return User.find(filter).select("name email income stats").limit(20).sort({ name: 1 });
}

module.exports = {
  getMe,
  searchUsers,
};
