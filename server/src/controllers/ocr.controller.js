const ocrService = require("../services/ocr.service");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");

const scanReceipt = asyncHandler(async (req, res) => {
  const errors = ocrService.validateReceiptFile(req.file);
  if (errors.length) throw new AppError(errors.join("; "), 400);

  try {
    const result = await ocrService.extractText(req.file.path);
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
