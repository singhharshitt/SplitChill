const express = require("express");
const aiController = require("../controllers/ai.controller");
const { schemas, validate } = require("../middleware/validate");

const router = express.Router();

router.post("/chat", validate(schemas.aiChat), aiController.chat);

module.exports = router;
