const ocrService = require("../services/ocr.service");
const Group = require("../models/Group");
const { ensureMembership } = require("../services/group.service");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");

const scanReceipt = asyncHandler(async (req, res) => {
  // Scanning happens in the context of a group; the caller must be a member.
  const group = await Group.findById(req.params.id);
  if (!group) throw new AppError("Group not found", 404);
  ensureMembership(group, req.user._id);

  const errors = ocrService.validateReceiptFile(req.file);
  if (errors.length) throw new AppError(errors.join("; "), 400);

  try {
    const result = await ocrService.extractText(req.file.path);
    if (!result.receiptDetected) {
      throw new AppError("Unable to detect a valid bill or receipt.", 422, {
        confidence: result.confidence,
      });
    }
    res.json({
      success: true,
      data: {
        rawText: result.rawText,
        provider: result.provider,
        confidence: result.confidence,
        fields: result.fields,
        error: result.error || null,
      },
    });
  } finally {
    ocrService.cleanupFile(req.file?.path);
  }
});

module.exports = { scanReceipt };
