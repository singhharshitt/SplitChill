const { RateLimiterRedis } = require("rate-limiter-flexible");
const { redisClient } = require("../config/redis");

const rateLimiterOpts = {
  storeClient: redisClient,
  keyPrefix: "rl",
};

const otpLimiter = new RateLimiterRedis({
  ...rateLimiterOpts,
  points: 5,
  duration: 60 * 15, // 5 requests per 15 minutes
});

const paymentInitLimiter = new RateLimiterRedis({
  ...rateLimiterOpts,
  points: 10,
  duration: 60, // 10 requests per minute
});

const webhookLimiter = new RateLimiterRedis({
  ...rateLimiterOpts,
  points: 50,
  duration: 10, // 50 requests per 10 seconds (abuse prevention)
});

const rateLimitMiddleware = (limiter) => async (req, res, next) => {
  try {
    await limiter.consume(req.ip);
    next();
  } catch (rejection) {
    res.status(429).json({ success: false, error: "Too many requests" });
  }
};

module.exports = {
  otpLimiter: rateLimitMiddleware(otpLimiter),
  paymentInitLimiter: rateLimitMiddleware(paymentInitLimiter),
  webhookLimiter: rateLimitMiddleware(webhookLimiter),
};
