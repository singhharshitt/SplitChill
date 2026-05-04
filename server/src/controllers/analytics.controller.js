const analyticsService = require("../services/analytics.service");
const asyncHandler = require("../utils/asyncHandler");

const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getAnalytics(req.params.id, req.user._id);
  res.json({ success: true, data: { analytics } });
});

module.exports = { getAnalytics };
