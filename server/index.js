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

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const SOCKET_CLIENT_URL = CLIENT_URL.split(",").map((origin) => origin.trim());
const server = http.createServer(app);

initSocket(server, SOCKET_CLIENT_URL);

connectDb()
  .then(async () => {
    await createIndexes();
    startPaymentReconciliationJob();
    startSmsRetryJob();
    server.listen(PORT, () => {
      console.log(`SplitChill API listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start SplitChill API", error);
    process.exit(1);
  });
