const express = require("express");
const paymentController = require("../controllers/payment.controller");
const requireAdmin = require("../middleware/admin");
const { schemas, validate } = require("../middleware/validate");
const validatePagination = require("../middleware/validatePagination");

const router = express.Router();

router.post("/transactions/:transactionId/initiate", validate(schemas.transactionIdParam, "params"), validate(schemas.initiatePayment), paymentController.initiatePayment);
router.get("/", validatePagination, paymentController.getPayments);
router.get("/:id/events", validate(schemas.idParam, "params"), validatePagination, paymentController.getPaymentEvents);
router.post("/otp/start", validate(schemas.startOtp), paymentController.startOtp);
router.post("/otp/verify", validate(schemas.verifyOtp), paymentController.verifyOtp);
router.post("/sms/:id/resend", validate(schemas.idParam, "params"), requireAdmin, paymentController.resendSms);

module.exports = router;
