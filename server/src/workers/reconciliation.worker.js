const { Worker } = require("bullmq");
const { queueConnection, queuePrefix } = require("../queues/connection");
const { reconcilePayments } = require("../jobs/paymentReconciliation.job");

const reconciliationWorker = new Worker("reconciliation", async (job) => {
  console.log(`[Worker] Starting reconciliation job ${job.id}`);
  await reconcilePayments();
}, {
  connection: queueConnection,
  prefix: queuePrefix,
  concurrency: 1
});

reconciliationWorker.on("failed", (job, err) => {
  console.error(`[Worker] Reconciliation job ${job?.id} failed: ${err.message}`);
});

reconciliationWorker.on("completed", (job) => {
  console.log(`[Worker] Reconciliation job ${job.id} completed successfully`);
});

module.exports = reconciliationWorker;
