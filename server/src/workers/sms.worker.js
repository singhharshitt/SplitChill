const { Worker } = require("bullmq");
const { queueConnection, queuePrefix } = require("../queues/connection");
const smsService = require("../services/sms.service");

const smsWorker = new Worker("sms", async (job) => {
  console.log(`[Worker] Processing SMS job ${job.id}`);
  await smsService.sendSms(job.data);
}, {
  connection: queueConnection,
  prefix: queuePrefix,
  concurrency: 5
});

smsWorker.on("failed", (job, err) => {
  console.error(`[Worker] SMS job ${job?.id} failed: ${err.message}`);
});

smsWorker.on("completed", (job) => {
  console.log(`[Worker] SMS job ${job.id} completed successfully`);
});

module.exports = smsWorker;
