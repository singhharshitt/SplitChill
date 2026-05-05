const express = require("express");
const authController = require("../controllers/auth.controller");
const protect = require("../middleware/auth");
const { schemas, validate } = require("../middleware/validate");

const router = express.Router();

router.post("/register", validate(schemas.register), authController.register);
router.post("/login", validate(schemas.login), authController.login);
router.post("/refresh", validate(schemas.refresh), authController.refresh);
router.post("/logout", protect, authController.logout);

module.exports = router;
