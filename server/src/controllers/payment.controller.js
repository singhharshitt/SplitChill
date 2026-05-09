const paymentService = require("../services/payment.service");
const smsService = require("../services/sms.service");
const { writeAudit } = require("../services/audit.service");
const asyncHandler = require("../utils/asyncHandler");

const initiatePayment = asyncHandler(async (req, res) => {
  const idempotencyKey = req.headers["idempotency-key"];
  if (!idempotencyKey) {
    res.status(400).json({ success: false, message: "Idempotency-Key header is required" });
    return;
  }
  const result = await paymentService.initiatePayment(req.user._id, req.params.transactionId, {
    idempotencyKey,
    currency: req.body.currency,
  });
  await writeAudit({
    actor: req.user._id,
    action: "payment.initiated",
    resourceType: "Payment",
    resourceId: result.payment._id,
    group: result.payment.group,
    req,
  });
  res.status(201).json({ success: true, data: result });
});

const getPayments = asyncHandler(async (req, res) => {
  const result = await paymentService.getPayments(req.user._id, req.query);
  res.json({ success: true, data: result });
});

const getPaymentEvents = asyncHandler(async (req, res) => {
  const result = await paymentService.getPaymentEvents(req.user._id, req.params.id, req.query);
  res.json({ success: true, data: result });
});

const startOtp = asyncHandler(async (req, res) => {
  const result = await smsService.startOtp(req.user._id, req.body.phone);
  await writeAudit({ actor: req.user._id, action: "otp.started", resourceType: "User", resourceId: req.user._id, req });
  res.status(201).json({ success: true, data: result });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const result = await smsService.verifyOtp(req.user._id, req.body.challengeId, req.body.code);
  await writeAudit({ actor: req.user._id, action: "otp.verified", resourceType: "User", resourceId: req.user._id, req });
  res.json({ success: true, data: result });
});

const resendSms = asyncHandler(async (req, res) => {
  const result = await smsService.resendSms(req.user._id, req.params.id);
  await writeAudit({ actor: req.user._id, action: "sms.resent", resourceType: "SmsLog", resourceId: req.params.id, req });
  res.status(201).json({ success: true, data: { sms: result } });
});

module.exports = {
  getPaymentEvents,
  getPayments,
  initiatePayment,
  resendSms,
  startOtp,
  verifyOtp,
};
