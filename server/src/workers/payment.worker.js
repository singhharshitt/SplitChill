const { Worker } = require("bullmq");
const { queueConnection, queuePrefix } = require("../queues/connection");
const paymentService = require("../services/payment.service");

const paymentWorker = new Worker("payment", async (job) => {
  if (job.name === "process-webhook") {
    console.log(`[Worker] Processing payment webhook job ${job.id}`);
    await paymentService.handleHyperswitchWebhook(job.data);
  }
}, {
  connection: queueConnection,
  prefix: queuePrefix,
  concurrency: 5
});

paymentWorker.on("failed", (job, err) => {
  console.error(`[Worker] Payment job ${job?.id} failed: ${err.message}`);
});

paymentWorker.on("completed", (job) => {
  console.log(`[Worker] Payment job ${job.id} completed successfully`);
});

module.exports = paymentWorker;
