const { Redis } = require("ioredis");

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

const redisClient = new Redis(process.env.REDIS_URL, redisOptions);

redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.on("connect", () => console.log("Redis Client Connected"));

function createRedisPubSubClients() {
  const pubClient = new Redis(process.env.SOCKET_REDIS_URL || process.env.REDIS_URL, redisOptions);
  const subClient = pubClient.duplicate();
  return { pubClient, subClient };
}

module.exports = {
  redisClient,
  createRedisPubSubClients
};
