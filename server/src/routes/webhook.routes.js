const express = require("express");
const webhookController = require("../controllers/webhook.controller");

const router = express.Router();

router.post("/hyperswitch", webhookController.hyperswitch);
router.post("/textbee", webhookController.textbee);

module.exports = router;
