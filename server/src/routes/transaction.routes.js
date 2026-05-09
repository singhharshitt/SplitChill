const express = require("express");
const transactionController = require("../controllers/transaction.controller");
const { schemas, validate } = require("../middleware/validate");

const router = express.Router();

router.post("/settle", validate(schemas.settle), transactionController.settle);
router.patch("/transactions/:id/confirm", validate(schemas.idParam, "params"), validate(schemas.confirmPayment), transactionController.confirmPayment);
router.get("/transactions", validate(schemas.transactionQuery, "query"), transactionController.getTransactions);

module.exports = router;
