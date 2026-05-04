const express = require("express");
const authRoutes = require("./auth.routes");
const groupRoutes = require("./group.routes");
const transactionRoutes = require("./transaction.routes");
const userRoutes = require("./user.routes");
const protect = require("../middleware/auth");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "SplitChill API",
    capabilities: ["fairness-engine", "predictions", "analytics", "realtime"],
  });
});

router.use("/auth", authRoutes);
router.use(protect);
router.use("/users", userRoutes);
router.use("/groups", groupRoutes);
router.use("/", transactionRoutes);

module.exports = router;
