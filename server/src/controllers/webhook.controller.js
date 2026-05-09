const { redisClient } = require("../config/redis");
const { paymentQueue } = require("../queues/payment.queue");
const smsService = require("../services/sms.service");
const asyncHandler = require("../utils/asyncHandler");
const crypto = require("crypto");

const hyperswitch = asyncHandler(async (req, res) => {
  const rawBody = req.rawBody || JSON.stringify(req.body || {});
  const payload = req.body || {};
  
  // Try to extract event_id or fallback to hash of body
  const eventId = payload.event_id || payload.id || payload.webhook_id || crypto.createHash("sha256").update(rawBody).digest("hex");
  
  if (eventId) {
    const isNew = await redisClient.set(`webhook:hs:${eventId}`, "1", "NX", "EX", 86400); // 24 hour expiry
    if (!isNew) {
      return res.status(200).json({ success: true, message: "Duplicate webhook ignored via Redis Idempotency" });
    }
  }

  // Enqueue for async processing
  await paymentQueue.add("process-webhook", {
    rawBody,
    headers: req.headers,
    payload
  });

  res.status(200).json({ success: true, message: "Webhook accepted for processing" });
});

const textbee = asyncHandler(async (req, res) => {
  const result = await smsService.handleTextbeeWebhook(req.rawBody || JSON.stringify(req.body || {}), req.headers, req.body);
  res.json({ success: true, data: result });
});

module.exports = {
  hyperswitch,
  textbee,
};
