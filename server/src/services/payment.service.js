function encode(value) {
  return encodeURIComponent(String(value || ""));
}

function buildUpiDeepLink({ payeeVpa, payeeName, amount, note, transactionId }) {
  const params = [
    `pa=${encode(payeeVpa)}`,
    `pn=${encode(payeeName || "SplitChill")}`,
    `am=${encode(Number(amount).toFixed(2))}`,
    "cu=INR",
    `tn=${encode(note || "SplitChill settlement")}`,
    `tr=${encode(transactionId)}`,
  ];
  return `upi://pay?${params.join("&")}`;
}

module.exports = {
  buildUpiDeepLink,
};
