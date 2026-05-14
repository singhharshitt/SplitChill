const express = require("express");
const demoController = require("../controllers/demo.controller");
const { authLimiter } = require("../middleware/authRateLimit");

const router = express.Router();

router.get("/status", demoController.status);
router.post("/setup", authLimiter, demoController.setup);
router.post("/login", authLimiter, demoController.login);

module.exports = router;
