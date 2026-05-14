const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(16).optional(),
  JWT_REFRESH_SECRET: z.string().min(16).optional(),
  MONGO_URI: z.string().optional(),
  MONGODB_URI: z.string().optional(),
  DB_URI: z.string().optional(),
  MONGO_FALLBACK_URI: z.string().optional(),
  MONGO_DEV_FALLBACK: z.string().optional(),
  REDIS_URL: z.string().optional(),
  SOCKET_REDIS_URL: z.string().optional(),

  // Hyperswitch payment
  HYPERSWITCH_BASE_URL: z.string().url().default("https://sandbox.hyperswitch.io"),
  HYPERSWITCH_API_KEY: z.string().optional(),
  HyperID: z.string().optional(), // alias for HYPERSWITCH_API_KEY
  HYPERSWITCH_WEBHOOK_SECRET: z.string().optional(),
  HYPERSWITCH_PAYMENT_RESPONSE_HASH_KEY: z.string().optional(),
  HYPERSWITCH_WEBHOOK_TOLERANCE_MS: z.coerce.number().default(5 * 60 * 1000),

  // AI — Groq
  GROQ_API_KEY: z.string().optional(),
  groq: z.string().optional(), // alias
  // AI — Mistral (fallback)
  MISTRAL_API_KEY: z.string().optional(),
  Mistral: z.string().optional(), // alias

  // OCR
  OCRSPACE_API_KEY: z.string().optional(),
  OCRSPACE: z.string().optional(), // alias

  // SMS
  TEXTBEE_BASE_URL: z.string().url().default("https://api.textbee.dev/api/v1"),
  TEXTBEE_API_KEY: z.string().optional(),
  TEXTBEE_DEVICE_ID: z.string().optional(),
  TEXTBEE_WEBHOOK_SECRET: z.string().optional(),
  OTP_TTL_MS: z.coerce.number().default(5 * 60 * 1000),
  OTP_RATE_LIMIT_PER_15_MIN: z.coerce.number().default(3),

  // Jobs
  PAYMENT_RECONCILIATION_INTERVAL_MS: z.coerce.number().default(5 * 60 * 1000),
  SMS_RETRY_INTERVAL_MS: z.coerce.number().default(2 * 60 * 1000),
  SMS_MAX_ATTEMPTS: z.coerce.number().default(5),
  DISABLE_BACKGROUND_JOBS: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(300),
  DEMO_AUTH_ENABLED: z.string().optional(),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid environment: ${details}`);
  }
  const isProduction = parsed.data.NODE_ENV === "production";

  // ── Alias resolution ──
  // Resolve HyperID → HYPERSWITCH_API_KEY
  if (!parsed.data.HYPERSWITCH_API_KEY && parsed.data.HyperID) {
    process.env.HYPERSWITCH_API_KEY = parsed.data.HyperID;
    parsed.data.HYPERSWITCH_API_KEY = parsed.data.HyperID;
  }
  // Resolve groq → GROQ_API_KEY
  if (!parsed.data.GROQ_API_KEY && parsed.data.groq) {
    process.env.GROQ_API_KEY = parsed.data.groq;
    parsed.data.GROQ_API_KEY = parsed.data.groq;
  }
  // Resolve Mistral → MISTRAL_API_KEY
  if (!parsed.data.MISTRAL_API_KEY && parsed.data.Mistral) {
    process.env.MISTRAL_API_KEY = parsed.data.Mistral;
    parsed.data.MISTRAL_API_KEY = parsed.data.Mistral;
  }
  // Resolve OCRSPACE → OCRSPACE_API_KEY
  if (!parsed.data.OCRSPACE_API_KEY && parsed.data.OCRSPACE) {
    process.env.OCRSPACE_API_KEY = parsed.data.OCRSPACE;
    parsed.data.OCRSPACE_API_KEY = parsed.data.OCRSPACE;
  }

  if (!isProduction && !parsed.data.JWT_SECRET) {
    process.env.JWT_SECRET = "dev_split_chill_secret";
    parsed.data.JWT_SECRET = process.env.JWT_SECRET;
  }

  if (!isProduction && !parsed.data.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET = "dev_split_chill_refresh_secret";
    parsed.data.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  }

  if (!isProduction && !parsed.data.MONGO_URI && !parsed.data.MONGODB_URI && !parsed.data.DB_URI) {
    process.env.MONGO_URI = "mongodb://127.0.0.1:27017/splitchill";
    parsed.data.MONGO_URI = process.env.MONGO_URI;
  }

  if (!parsed.data.MONGO_URI && !parsed.data.MONGODB_URI && !parsed.data.DB_URI) {
    throw new Error("Invalid environment: one of MONGO_URI, MONGODB_URI, or DB_URI is required");
  }

  if (isProduction) {
    const required = [
      "JWT_SECRET",
      "JWT_REFRESH_SECRET",
    ];
    const missing = required.filter((key) => !parsed.data[key]);
    if (missing.length) throw new Error(`Invalid production environment: missing ${missing.join(", ")}`);
  }
  return parsed.data;
}

module.exports = {
  validateEnv,
};
