import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
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

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
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
        // Clear legacy refresh token from localStorage — cookie is the new home
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch {
        refreshRequest = null;
      }
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
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
