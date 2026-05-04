const express = require("express");
const userController = require("../controllers/user.controller");

const router = express.Router();

router.get("/me", userController.getMe);
router.get("/", userController.searchUsers);

module.exports = router;
