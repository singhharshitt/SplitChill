/**
 * UPI Service — direct member-to-member settlement support.
 *
 * SplitChill never routes money through its own merchant account. This service
 * builds a standard UPI intent URI (upi://pay) that contains the recipient's
 * saved UPI ID, the exact outstanding amount, and a transaction reference.
 * The payer opens it in any UPI app (GPay/PhonePe/Paytm/BHIM) or scans the QR.
 *
 * IMPORTANT: a UPI intent or QR code is a *payment initiation* mechanism only.
 * It is NOT proof that money moved. The app will NOT see the transfer succeed
 * until the recipient explicitly confirms receipt inside SplitChill.
 */
const qrcode = require("qrcode");
const AppError = require("../utils/appError");

// UPI VPA: `name@bank` — local part 2+ chars, handle 2+ alpha start.
const VPA_PATTERN = /^[\w.\-]{2,}@[a-zA-Z]{2,}[\w.\-]*$/;

// UPI `tr` reference: alphanumeric, 1..35 chars per UPI spec.
function sanitizeTransactionReference(transactionId) {
  return String(transactionId || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 35);
}

/**
 * Validate a user-supplied UPI ID.
 * @param {string} vpa
 * @returns {string} the normalized value
 * @throws {AppError} 400 for invalid UPI ids
 */
function assertValidUpiId(vpa) {
  const value = String(vpa || "").trim();
  if (!VPA_PATTERN.test(value)) {
    throw new AppError("Invalid UPI ID format. Expected something like name@bank.", 400);
  }
  return value;
}

function encode(value) {
  return encodeURIComponent(String(value || ""));
}

/**
 * Build the UPI intent link for a settlement.
 * @param {object} options
 * @param {string} options.payeeVpa — recipient UPI ID (already validated)
 * @param {string} options.payeeName — recipient display name
 * @param {number} options.amount — INR amount (positive)
 * @param {string} [options.note] — note shown to the payer in the UPI app
 * @param {string} options.transactionId — SplitChill transaction id (tr param)
 * @returns {string} upi://pay?... deep link
 */
function buildUpiIntent({ payeeVpa, payeeName, amount, note, transactionId }) {
  const vpa = assertValidUpiId(payeeVpa);
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new AppError("Settlement amount must be a positive number", 400);
  }

  const params = [
    `pa=${encode(vpa)}`,
    `pn=${encode(payeeName || "SplitChill member")}`,
    `am=${encode(numericAmount.toFixed(2))}`,
    `cu=INR`,
    `tr=${encode(sanitizeTransactionReference(transactionId))}`,
  ];
  if (note) params.push(`tn=${encode(note)}`);

  return `upi://pay?${params.join("&")}`;
}

/**
 * Generate a QR code (as a data URL) for a UPI intent.
 * Small canvases (~8px module) keep the image compact.
 * @param {string} upiIntent
 * @returns {Promise<string>} data:image/png;base64,...
 */
async function buildUpiQrDataUrl(upiIntent) {
  if (!upiIntent || !upiIntent.startsWith("upi://pay?")) {
    throw new AppError("Cannot build a QR code for an invalid UPI intent", 400);
  }
  return qrcode.toDataURL(upiIntent, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 6,
  });
}

module.exports = {
  assertValidUpiId,
  buildUpiIntent,
  buildUpiQrDataUrl,
  sanitizeTransactionReference,
  VPA_PATTERN,
};
