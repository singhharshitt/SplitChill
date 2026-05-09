const { Queue } = require("bullmq");
const { queueConnection, queuePrefix, defaultJobOptions } = require("./connection");

const reconciliationQueue = new Queue("reconciliation", {
  connection: queueConnection,
  prefix: queuePrefix,
  defaultJobOptions,
});

const enqueueReconciliation = async (payload = {}) => {
  return reconciliationQueue.add("reconcile-all", payload);
};

module.exports = { reconciliationQueue, enqueueReconciliation };
