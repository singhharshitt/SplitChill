const authService = require("../services/auth.service");
const asyncHandler = require("../utils/asyncHandler");

const REFRESH_COOKIE = "splitchill_rt";
const REFRESH_TTL_MS = Number(process.env.REFRESH_TOKEN_TTL_MS || 30 * 24 * 60 * 60 * 1000);
const isProduction = process.env.NODE_ENV === "production";
const refreshCookieSameSite = isProduction ? "none" : "lax";

function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: refreshCookieSameSite,
    path: "/api/auth",
    maxAge: REFRESH_TTL_MS,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: refreshCookieSameSite,
    path: "/api/auth",
  });
}

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  setRefreshCookie(res, result.refreshToken);
  const payload = {
    user: result.user,
    token: result.token,
  };
  // For local development only, include the refresh token in the JSON body
  // to make it easy to work around browser cookie restrictions on localhost.
  if (!isProduction) payload.refreshToken = result.refreshToken;
  res.status(201).json({ success: true, data: payload });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  setRefreshCookie(res, result.refreshToken);
  const payload = { user: result.user, token: result.token };
  if (!isProduction) payload.refreshToken = result.refreshToken;
  res.json({ success: true, data: payload });
});

const refresh = asyncHandler(async (req, res) => {
  // Accept refresh token from httpOnly cookie first, fall back to body for backward compat
  const refreshToken = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ success: false, error: "Refresh token required" });
  }
  const result = await authService.refresh(refreshToken);
  setRefreshCookie(res, result.refreshToken);
  const payload = { user: result.user, token: result.token };
  if (!isProduction) payload.refreshToken = result.refreshToken;
  res.json({ success: true, data: payload });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  clearRefreshCookie(res);
  res.json({ success: true });
});

module.exports = { login, logout, refresh, register };
