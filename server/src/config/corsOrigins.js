const DEFAULT_CLIENT_URL = "http://localhost:5173";
const PRODUCTION_CLIENT_URLS = [
  "https://splitchill.vercel.app",
];

function getConfiguredOrigins(clientUrl = process.env.CLIENT_URL || DEFAULT_CLIENT_URL) {
  const configuredOrigins = clientUrl
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  return [...new Set([...configuredOrigins, ...PRODUCTION_CLIENT_URLS])];
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
