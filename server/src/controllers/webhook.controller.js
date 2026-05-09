const paymentService = require("../services/payment.service");
const smsService = require("../services/sms.service");
const asyncHandler = require("../utils/asyncHandler");

const hyperswitch = asyncHandler(async (req, res) => {
  const result = await paymentService.handleHyperswitchWebhook({
    rawBody: req.rawBody || JSON.stringify(req.body || {}),
    headers: req.headers,
    payload: req.body,
  });
  res.json({ success: true, data: result });
});

const textbee = asyncHandler(async (req, res) => {
  const result = await smsService.handleTextbeeWebhook(req.rawBody || JSON.stringify(req.body || {}), req.headers, req.body);
  res.json({ success: true, data: result });
});

module.exports = {
  hyperswitch,
  textbee,
};
