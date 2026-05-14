const express = require("express");
const userController = require("../controllers/user.controller");
const { schemas, validate } = require("../middleware/validate");

const router = express.Router();

router.get("/me", userController.getMe);
router.patch("/me", validate(schemas.updateMe), userController.updateMe);
router.get("/", userController.searchUsers);

module.exports = router;
