const DEFAULT_CLIENT_URL = "http://localhost:5173";

function getConfiguredOrigins(clientUrl = process.env.CLIENT_URL || DEFAULT_CLIENT_URL) {
  return clientUrl
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function isLocalDevelopmentOrigin(origin) {
  if (process.env.NODE_ENV === "production") return false;

  try {
    const { hostname, protocol } = new URL(origin);
    return (
      (protocol === "http:" || protocol === "https:") &&
      (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1")
    );
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin, allowedOrigins = getConfiguredOrigins()) {
  if (!origin) return true;

  const normalizedOrigin = origin.replace(/\/$/, "");
  return allowedOrigins.includes(normalizedOrigin) || isLocalDevelopmentOrigin(normalizedOrigin);
}

module.exports = {
  getConfiguredOrigins,
  isAllowedOrigin,
};
