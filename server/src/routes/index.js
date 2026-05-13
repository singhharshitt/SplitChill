const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./auth.routes");
const groupRoutes = require("./group.routes");
const paymentRoutes = require("./payment.routes");
const transactionRoutes = require("./transaction.routes");
const userRoutes = require("./user.routes");
const webhookRoutes = require("./webhook.routes");
const protect = require("../middleware/auth");

const router = express.Router();

router.get("/health", (_req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoStatus = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" }[mongoState] || "unknown";
  res.json({
    status: mongoState === 1 ? "ok" : "degraded",
    service: "SplitChill API",
    mongo: mongoStatus,
    capabilities: ["fairness-engine", "predictions", "analytics", "realtime"],
    uptime: Math.floor(process.uptime()),
  });
});

router.get("/health/ready", (_req, res) => {
  const isReady = mongoose.connection.readyState === 1;
  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    mongo: isReady ? "connected" : "not ready",
  });
});

router.use("/auth", authRoutes);
router.use("/webhooks", webhookRoutes);
router.use(protect);
router.use("/users", userRoutes);
router.use("/groups", groupRoutes);
router.use("/payments", paymentRoutes);
router.use("/", transactionRoutes);

module.exports = router;
