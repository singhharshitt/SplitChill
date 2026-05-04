const userService = require("../services/user.service");
const asyncHandler = require("../utils/asyncHandler");

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getMe(req.user);
  res.json({ success: true, data: { user } });
});

const searchUsers = asyncHandler(async (req, res) => {
  const users = await userService.searchUsers(req.query.q, req.user._id);
  res.json({ success: true, data: { users } });
});

module.exports = {
  getMe,
  searchUsers,
};
