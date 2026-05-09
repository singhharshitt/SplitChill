const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16).optional(),
  MONGO_URI: z.string().optional(),
  MONGODB_URI: z.string().optional(),
  DB_URI: z.string().optional(),
  REDIS_URL: z.string().optional(),
  SOCKET_REDIS_URL: z.string().optional(),
  HYPERSWITCH_BASE_URL: z.string().url().default("https://sandbox.hyperswitch.io"),
  HYPERSWITCH_API_KEY: z.string().optional(),
  HYPERSWITCH_WEBHOOK_SECRET: z.string().optional(),
  HYPERSWITCH_WEBHOOK_TOLERANCE_MS: z.coerce.number().default(5 * 60 * 1000),
  TEXTBEE_BASE_URL: z.string().url().default("https://api.textbee.dev/api/v1"),
  TEXTBEE_API_KEY: z.string().optional(),
  TEXTBEE_DEVICE_ID: z.string().optional(),
  TEXTBEE_WEBHOOK_SECRET: z.string().optional(),
  OTP_TTL_MS: z.coerce.number().default(5 * 60 * 1000),
  OTP_RATE_LIMIT_PER_15_MIN: z.coerce.number().default(3),
  PAYMENT_RECONCILIATION_INTERVAL_MS: z.coerce.number().default(5 * 60 * 1000),
  SMS_RETRY_INTERVAL_MS: z.coerce.number().default(2 * 60 * 1000),
  SMS_MAX_ATTEMPTS: z.coerce.number().default(5),
  DISABLE_BACKGROUND_JOBS: z.string().optional(),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid environment: ${details}`);
  }
  if (!parsed.data.MONGO_URI && !parsed.data.MONGODB_URI && !parsed.data.DB_URI) {
    throw new Error("Invalid environment: one of MONGO_URI, MONGODB_URI, or DB_URI is required");
  }
  if (parsed.data.NODE_ENV === "production") {
    const required = [
      "HYPERSWITCH_API_KEY",
      "HYPERSWITCH_WEBHOOK_SECRET",
      "TEXTBEE_API_KEY",
      "TEXTBEE_DEVICE_ID",
      "TEXTBEE_WEBHOOK_SECRET",
    ];
    const missing = required.filter((key) => !parsed.data[key]);
    if (missing.length) throw new Error(`Invalid production environment: missing ${missing.join(", ")}`);
  }
  return parsed.data;
}

module.exports = {
  validateEnv,
};
