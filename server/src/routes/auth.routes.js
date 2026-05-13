const express = require("express");
const authController = require("../controllers/auth.controller");
const protect = require("../middleware/auth");
const { schemas, validate } = require("../middleware/validate");
const { authLimiter, loginLimiter } = require("../middleware/authRateLimit");

const router = express.Router();

router.post("/register", authLimiter, validate(schemas.register), authController.register);
router.post("/login", loginLimiter, validate(schemas.login), authController.login);
router.post("/refresh", authLimiter, validate(schemas.refresh), authController.refresh);
router.post("/logout", protect, authController.logout);

module.exports = router;
