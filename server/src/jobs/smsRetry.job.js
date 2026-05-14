const mongoose = require("mongoose");
const SmsLog = require("../models/SmsLog");
const smsService = require("../services/sms.service");

async function retryFailedSms() {
  if (mongoose.connection.readyState !== 1) return;

  const due = await SmsLog.find({
    status: "failed",
    nextRetryAt: { $lte: new Date() },
    attempts: { $lt: Number(process.env.SMS_MAX_ATTEMPTS || 5) },
  }).limit(50);

  for (const sms of due) {
    await smsService.sendSms({
      recipient: sms.recipient,
      message: sms.messagePreview,
      purpose: sms.purpose,
      user: sms.user,
      group: sms.group,
      payment: sms.payment,
      transaction: sms.transaction,
      metadata: { retryOf: sms._id },
    });
  }
}

function startSmsRetryJob() {
  const interval = Number(process.env.SMS_RETRY_INTERVAL_MS || 2 * 60 * 1000);
  if (process.env.DISABLE_BACKGROUND_JOBS === "true") return null;
  return setInterval(() => {
    retryFailedSms().catch((error) => console.error("SMS retry failed", error));
  }, interval);
}

module.exports = {
  retryFailedSms,
  startSmsRetryJob,
};
