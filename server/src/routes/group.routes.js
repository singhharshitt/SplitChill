const express = require("express");
const groupController = require("../controllers/group.controller");
const expenseController = require("../controllers/expense.controller");
const fairnessController = require("../controllers/fairness.controller");
const analyticsController = require("../controllers/analytics.controller");
const predictionController = require("../controllers/prediction.controller");
const chatController = require("../controllers/chat.controller");

const router = express.Router();

router.post("/", groupController.createGroup);
router.get("/:id", groupController.getGroup);
router.post("/:id/add-member", groupController.addMember);

router.post("/:id/expenses", expenseController.addExpense);
router.get("/:id/expenses", expenseController.getExpenses);

router.get("/:id/fairness", fairnessController.getFairness);
router.post("/:id/recommend-split", fairnessController.recommendSplit);

router.get("/:id/analytics", analyticsController.getAnalytics);
router.get("/:id/suggestions", predictionController.getSuggestions);

router.post("/:id/chat/messages", chatController.createMessage);

module.exports = router;
