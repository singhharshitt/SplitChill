export function parseCurrencyInput(value) {
  const text = String(value ?? "").trim().replace(/[,$\s₹£€]/g, "");
  if (!text) return 0;

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isCurrencyInputValid(value) {
  const text = String(value ?? "").trim().replace(/[,$\s₹£€]/g, "");
  if (!text) return true;

  return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text);
}