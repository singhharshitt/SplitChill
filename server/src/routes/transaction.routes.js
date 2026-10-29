const express = require("express");
const transactionController = require("../controllers/transaction.controller");
const { schemas, validate } = require("../middleware/validate");
const validatePagination = require("../middleware/validatePagination");

const router = express.Router();

// Direct member-to-member settlement (UPI intent or manual)
router.post("/settle", validate(schemas.settle), transactionController.settle);
router.patch("/transactions/:id/report", validate(schemas.idParam, "params"), validate(schemas.confirmPayment), transactionController.reportPayment);
router.patch("/transactions/:id/confirm", validate(schemas.idParam, "params"), validate(schemas.confirmPayment), transactionController.confirmPayment);
router.patch("/transactions/:id/cancel", validate(schemas.idParam, "params"), validate(schemas.cancelSettlement), transactionController.cancelSettlement);
router.get("/transactions", validatePagination, transactionController.getTransactions);

module.exports = router;
