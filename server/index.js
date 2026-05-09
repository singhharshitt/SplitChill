const dotenv = require("dotenv");
const http = require("http");

dotenv.config();

const { validateEnv } = require("./src/config/env");
validateEnv();

const app = require("./src/app");
const connectDb = require("./src/config/db");
const { initSocket } = require("./src/socket/socketHub");
const { createIndexes } = require("./src/utils/createIndexes");

// Import Redis & workers
require("./src/config/redis");
require("./src/workers/sms.worker");
require("./src/workers/payment.worker");
require("./src/workers/reconciliation.worker");
const { reconciliationQueue } = require("./src/queues/reconciliation.queue");

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const SOCKET_CLIENT_URL = CLIENT_URL.split(",").map((origin) => origin.trim());
const server = http.createServer(app);

initSocket(server, SOCKET_CLIENT_URL);
app.set("io", require("./src/socket/socketHub").initSocket); // Or wait, `initSocket` already returned io. But we usually use `emitToGroup` directly now.

connectDb()
  .then(async () => {
    await createIndexes();
    
    // Add repeating job for reconciliation on boot (runs every 15 minutes)
    await reconciliationQueue.add("reconcile-all", {}, { repeat: { pattern: "*/15 * * * *" } });
    
    server.listen(PORT, () => {
      console.log(`SplitChill API listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start SplitChill API", error);
    process.exit(1);
  });
