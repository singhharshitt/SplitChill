const { redisClient } = require("../config/redis");

const queueConnection = redisClient;
const queuePrefix = process.env.QUEUE_PREFIX || "splitchill_q";

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: { age: 3600, count: 100 },
  removeOnFail: { age: 24 * 3600 },
};

module.exports = {
  queueConnection,
  queuePrefix,
  defaultJobOptions
};
