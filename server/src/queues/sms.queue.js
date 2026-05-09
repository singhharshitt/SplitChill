const { Queue } = require("bullmq");
const { queueConnection, queuePrefix, defaultJobOptions } = require("./connection");

const smsQueue = new Queue("sms", {
  connection: queueConnection,
  prefix: queuePrefix,
  defaultJobOptions,
});

const enqueueSms = async (payload) => {
  return smsQueue.add("sendSms", payload);
};

module.exports = { smsQueue, enqueueSms };
