const fairnessService = require("../services/fairness.service");
const asyncHandler = require("../utils/asyncHandler");
const { assertPositiveNumber, requireFields } = require("../middleware/validate");

const getFairness = asyncHandler(async (req, res) => {
  const fairness = await fairnessService.getFairness(req.params.id, req.user._id);
  res.json({ success: true, data: { fairness } });
});

const recommendSplit = asyncHandler(async (req, res) => {
  requireFields(req.body, ["amount"]);
  assertPositiveNumber(req.body.amount, "amount");

  const recommendation = await fairnessService.recommendSplit(req.params.id, req.user._id, req.body);
  res.json({ success: true, data: { recommendation } });
});

module.exports = { getFairness, recommendSplit };
