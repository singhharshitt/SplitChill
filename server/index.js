const dotenv = require("dotenv");
const http = require("http");

dotenv.config();

const { validateEnv } = require("./src/config/env");
validateEnv();

const app = require("./src/app");
const connectDb = require("./src/config/db");
const { initSocket } = require("./src/socket/socketHub");
const { createIndexes } = require("./src/utils/createIndexes");
const { startPaymentReconciliationJob } = require("./src/jobs/paymentReconciliation.job");
const { startSmsRetryJob } = require("./src/jobs/smsRetry.job");
const { getConfiguredOrigins, isAllowedOrigin } = require("./src/config/corsOrigins");

const PORT = process.env.PORT || 5000;
const SOCKET_CLIENT_URL = (origin, callback) => {
  if (isAllowedOrigin(origin, getConfiguredOrigins())) return callback(null, true);
  return callback(new Error("Not allowed by CORS"));
};
const server = http.createServer(app);
let hasStartedListening = false;
let hasStartedJobs = false;

initSocket(server, SOCKET_CLIENT_URL);

function startListening() {
  if (hasStartedListening) return;
  hasStartedListening = true;
  server.listen(PORT, () => {
    console.log(`SplitChill API listening on port ${PORT}`);
  });
}

async function startDatabaseServices() {
  await createIndexes();
  if (!hasStartedJobs) {
    hasStartedJobs = true;
    startPaymentReconciliationJob();
    startSmsRetryJob();
  }
}

async function boot() {
  try {
    await connectDb();
    await startDatabaseServices();
    startListening();
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      console.error("Failed to start SplitChill API", error);
      process.exit(1);
    }

    console.error("MongoDB is unavailable; starting SplitChill API in development retry mode.");
    console.error(error.message || error);
    startListening();

    const retryMs = Number(process.env.MONGO_DEV_RETRY_MS || 10000);
    const retry = setInterval(async () => {
      try {
        await connectDb();
        await startDatabaseServices();
        clearInterval(retry);
        console.log("MongoDB connected after retry; SplitChill API is fully ready.");
      } catch (retryError) {
        console.warn(`MongoDB still unavailable; retrying in ${retryMs / 1000}s.`);
      }
    }, retryMs);
  }
}

boot();
