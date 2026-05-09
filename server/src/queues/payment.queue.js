const { Queue } = require("bullmq");
const { queueConnection, queuePrefix, defaultJobOptions } = require("./connection");

const paymentQueue = new Queue("payment", {
  connection: queueConnection,
  prefix: queuePrefix,
  defaultJobOptions,
});

const enqueuePaymentWebhook = async (payload) => {
  return paymentQueue.add("process-webhook", payload);
};

module.exports = { paymentQueue, enqueuePaymentWebhook };
