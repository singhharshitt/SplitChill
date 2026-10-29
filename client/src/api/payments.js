import api, { unwrap } from "./client.js";

const transactionPayload = (payload = {}) => ({
  providerReference: payload.providerReference,
});

/**
 * Report a settlement as "paid" — the payer's own claim only.
 * SplitChill cannot see whether the UPI transfer actually succeeded.
 */
export async function reportSettlementPaid(transactionId, payload = {}) {
  const response = await api.patch(`/transactions/${transactionId}/report`, transactionPayload(payload));
  return unwrap(response);
}

/**
 * Receiver confirms that the money arrived. This settles the balances.
 */
export async function confirmSettlement(transactionId, payload = {}) {
  const response = await api.patch(`/transactions/${transactionId}/confirm`, transactionPayload(payload));
  return unwrap(response);
}

/**
 * Either participant cancels a not-yet-confirmed settlement.
 */
export async function cancelSettlement(transactionId, payload = {}) {
  const response = await api.patch(`/transactions/${transactionId}/cancel`, payload);
  return unwrap(response);
}

/**
 * Update the signed-in user's saved UPI ID (account settings).
 */
export async function updateUserProfile(profile) {
  const response = await api.patch("/users/me", profile);
  return unwrap(response);
}

export async function fetchCurrentUser() {
  const response = await api.get("/users/me");
  return unwrap(response);
}
