const predictionService = require("../services/prediction.service");
const asyncHandler = require("../utils/asyncHandler");

const getSuggestions = asyncHandler(async (req, res) => {
  const suggestions = await predictionService.getSuggestions(req.params.id, req.user._id);
  res.json({ success: true, data: { suggestions } });
});

module.exports = { getSuggestions };
