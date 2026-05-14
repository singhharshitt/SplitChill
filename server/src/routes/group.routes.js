const express = require("express");
const groupController = require("../controllers/group.controller");
const expenseController = require("../controllers/expense.controller");
const fairnessController = require("../controllers/fairness.controller");
const analyticsController = require("../controllers/analytics.controller");
const predictionController = require("../controllers/prediction.controller");
const chatController = require("../controllers/chat.controller");
const ocrController = require("../controllers/ocr.controller");
const { schemas, validate } = require("../middleware/validate");
const validatePagination = require("../middleware/validatePagination");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", groupController.getGroups);
router.post("/", validate(schemas.createGroup), groupController.createGroup);
router.post("/direct", validate(schemas.directChat), groupController.createDirectChat);
router.get("/:id", groupController.getGroup);
router.post("/:id/add-member", validate(schemas.addMember), groupController.addMember);

router.post("/:id/expenses", validate(schemas.expense), expenseController.addExpense);
router.get("/:id/expenses", validatePagination, expenseController.getExpenses);

router.get("/:id/fairness", fairnessController.getFairness);
router.post("/:id/recommend-split", validate(schemas.recommendSplit), fairnessController.recommendSplit);

router.get("/:id/analytics", analyticsController.getAnalytics);
router.get("/:id/suggestions", predictionController.getSuggestions);

router.get("/:id/chat/messages", validatePagination, chatController.getMessages);
router.post("/:id/chat/messages", validate(schemas.chatMessage), chatController.createMessage);

router.post("/:id/scan-receipt", upload.single("receipt"), ocrController.scanReceipt);

module.exports = router;
