import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL;
const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL;
const defaultApiUrl = import.meta.env.PROD ? "https://splitchill.onrender.com/api" : "http://localhost:5000/api";

export const API_BASE_URL = (
  configuredApiUrl ||
  (configuredSocketUrl ? `${configuredSocketUrl.replace(/\/$/, "")}/api` : defaultApiUrl)
).replace(/\/$/, "");
export const TOKEN_KEY = "splitchill_token";
export const USER_KEY = "splitchill_user";

// Kept for backward compat — old clients may still have this in localStorage.
// The migration path: on next refresh cycle, the httpOnly cookie takes over
// and this key is cleared.
export const REFRESH_TOKEN_KEY = "splitchill_refresh_token";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // send httpOnly cookies on every request
});

export function getStoredToken() {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshRequest = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Refresh token is sent automatically via httpOnly cookie (withCredentials: true).
        // Fall back to localStorage for clients that haven't migrated yet.
        const legacyRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
        const body = legacyRefresh ? { refreshToken: legacyRefresh } : {};
        refreshRequest = refreshRequest || api.post("/auth/refresh", body);
        const data = unwrap(await refreshRequest);
        refreshRequest = null;
        if (data.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        } else {
          localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
        const activeStorage = sessionStorage.getItem(TOKEN_KEY) ? sessionStorage : localStorage;
        activeStorage.setItem(TOKEN_KEY, data.token);
        activeStorage.setItem(USER_KEY, JSON.stringify(data.user));
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch {
        refreshRequest = null;
      }
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    }
    return Promise.reject(error);
  },
);

export function getApiError(error, fallback = "Something went wrong. Please try again.") {
  return error.response?.data?.message || error.response?.data?.error || error.message || fallback;
}

export function unwrap(response) {
  return response.data?.data ?? response.data;
}

export default api;
