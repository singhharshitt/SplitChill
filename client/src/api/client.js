import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const TOKEN_KEY = "splitchill_token";
export const USER_KEY = "splitchill_user";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
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
