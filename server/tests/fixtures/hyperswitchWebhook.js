const crypto = require("crypto");

function createHyperswitchWebhookPayload({
  eventId = "evt_test_1",
  paymentId = "pay_test_1",
  splitChillPaymentId,
  status = "succeeded",
  created = Math.floor(Date.now() / 1000),
} = {}) {
  return {
    event_id: eventId,
    event_type: status === "succeeded" ? "payment_succeeded" : "payment_failed",
    created,
    content: {
      object: {
        payment_id: paymentId,
        status,
        metadata: {
          paymentId: splitChillPaymentId,
        },
      },
    },
  };
}

function signHyperswitchWebhook(payload, secret) {
  const rawBody = JSON.stringify(payload);
  return {
    rawBody,
    signature: crypto.createHmac("sha512", secret).update(rawBody).digest("hex"),
  };
}

module.exports = {
  createHyperswitchWebhookPayload,
  signHyperswitchWebhook,
};
