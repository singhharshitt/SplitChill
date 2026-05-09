import api, { unwrap } from "./client.js";

export async function initiateTransactionPayment(transactionId, payload = {}) {
  const idempotencyKey = payload.idempotencyKey || `payment-${transactionId}-${Date.now()}`;
  const response = await api.post(`/payments/transactions/${transactionId}/initiate`, payload, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return unwrap(response);
}

export async function fetchPayments({ limit = 20, cursor, status, groupId, signal } = {}) {
  const response = await api.get("/payments", {
    params: { limit, cursor, status, groupId },
    signal,
  });
  return unwrap(response);
}

export async function fetchPaymentEvents(paymentId, { limit = 20, cursor, signal } = {}) {
  const response = await api.get(`/payments/${paymentId}/events`, {
    params: { limit, cursor },
    signal,
  });
  return unwrap(response);
}

export async function startOtp(phone) {
  const response = await api.post("/payments/otp/start", { phone });
  return unwrap(response);
}

export async function verifyOtp(challengeId, code) {
  const response = await api.post("/payments/otp/verify", { challengeId, code });
  return unwrap(response);
}
