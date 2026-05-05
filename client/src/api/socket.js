import { io } from "socket.io-client";
import { API_BASE_URL, TOKEN_KEY } from "./client.js";

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api\/?$/, "")).replace(/\/$/, "");
let socket;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: () => ({ token: localStorage.getItem(TOKEN_KEY) }),
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function connectSocket() {
  const activeSocket = getSocket();
  if (!activeSocket.connected) activeSocket.connect();
  return activeSocket;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
