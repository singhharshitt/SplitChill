const express = require("express");
const transactionController = require("../controllers/transaction.controller");

const router = express.Router();

router.post("/settle", transactionController.settle);
router.get("/transactions", transactionController.getTransactions);

module.exports = router;
