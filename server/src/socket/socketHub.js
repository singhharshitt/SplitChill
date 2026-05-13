let io = null;

/** Map<groupId, Set<userId>> — tracks online users per group room */
const roomPresence = new Map();

/** Map<socketId, { userId, userName }> — reverse lookup */
const socketUsers = new Map();

/** Per-socket event counter for rate limiting */
const socketEventCounts = new Map();
const SOCKET_RATE_LIMIT = 30; // max events per window
const SOCKET_RATE_WINDOW_MS = 10_000;

function resetSocketRateLimit(socketId) {
  socketEventCounts.set(socketId, { count: 0, resetAt: Date.now() + SOCKET_RATE_WINDOW_MS });
}

function checkSocketRateLimit(socketId) {
  let entry = socketEventCounts.get(socketId);
  if (!entry || Date.now() > entry.resetAt) {
    resetSocketRateLimit(socketId);
    entry = socketEventCounts.get(socketId);
  }
  entry.count += 1;
  return entry.count <= SOCKET_RATE_LIMIT;
}

async function attachRedisAdapter(socketServer) {
  const redisUrl = process.env.SOCKET_REDIS_URL || process.env.REDIS_URL;
  if (!redisUrl) return;
  try {
    const { createAdapter } = require("@socket.io/redis-adapter");
    const { createClient } = require("redis");
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    socketServer.adapter(createAdapter(pubClient, subClient));
    console.log("Socket.io Redis adapter connected");
  } catch (error) {
    console.warn("Socket.io Redis adapter unavailable; continuing with in-memory adapter", error.message);
  }
}

function getGroupPresence(groupId) {
  const key = String(groupId);
  return [...(roomPresence.get(key) || [])];
}

function addPresence(groupId, userId) {
  const key = String(groupId);
  if (!roomPresence.has(key)) roomPresence.set(key, new Set());
  roomPresence.get(key).add(String(userId));
}

function removePresence(groupId, userId) {
  const key = String(groupId);
  const set = roomPresence.get(key);
  if (set) {
    set.delete(String(userId));
    if (set.size === 0) roomPresence.delete(key);
  }
}

function broadcastPresence(groupId) {
  if (!io) return;
  io.to(`group:${groupId}`).emit("presence:update", {
    groupId: String(groupId),
    onlineUsers: getGroupPresence(groupId),
  });
}

function initSocket(server, corsOrigin) {
  const { Server } = require("socket.io");
  const jwt = require("jsonwebtoken");
  const Group = require("../models/Group");
  const User = require("../models/User");
  const chatService = require("../services/chat.service");

  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
    },
    pingTimeout: 20000,
    pingInterval: 25000,
  });
  attachRedisAdapter(io);

  // ── Authentication middleware ──
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication token required"));
      if (!process.env.JWT_SECRET) return next(new Error("Server auth not configured"));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub).select("_id name email");
      if (!user) return next(new Error("Authenticated user no longer exists"));
      socket.user = user;
      return next();
    } catch {
      return next(new Error("Socket authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = String(socket.user._id);
    const userName = socket.user.name;
    socketUsers.set(socket.id, { userId, userName });
    resetSocketRateLimit(socket.id);

    // ── Join group room ──
    socket.on("group:join", async (groupId, ack) => {
      try {
        if (!groupId || !checkSocketRateLimit(socket.id)) return;
        const group = await Group.findOne({ _id: groupId, "members.user": socket.user._id }).select("_id").lean();
        if (!group) {
          if (typeof ack === "function") ack({ success: false, error: "Group access denied" });
          return;
        }
        socket.join(`group:${groupId}`);
        addPresence(groupId, userId);
        broadcastPresence(groupId);
        if (typeof ack === "function") ack({ success: true, onlineUsers: getGroupPresence(groupId) });
      } catch {
        if (typeof ack === "function") ack({ success: false, error: "Could not join group" });
      }
    });

    // ── Leave group room ──
    socket.on("group:leave", (groupId) => {
      if (!groupId) return;
      socket.leave(`group:${groupId}`);
      removePresence(groupId, userId);
      broadcastPresence(groupId);
    });

    // ── Chat message via socket (real-time path) ──
    socket.on("chat:message", async (payload, ack) => {
      if (!checkSocketRateLimit(socket.id)) {
        if (typeof ack === "function") ack({ success: false, error: "Rate limit exceeded" });
        return;
      }
      try {
        const { groupId, text } = payload || {};
        if (!groupId || !text || typeof text !== "string" || text.trim().length === 0 || text.length > 1000) {
          if (typeof ack === "function") ack({ success: false, error: "Invalid message" });
          return;
        }
        const message = await chatService.createMessage(groupId, userId, text.trim(), {});
        if (typeof ack === "function") ack({ success: true, message });
      } catch (err) {
        if (typeof ack === "function") ack({ success: false, error: err.message || "Could not send message" });
      }
    });

    // ── Typing indicators ──
    socket.on("chat:typing", (groupId) => {
      if (!groupId || !checkSocketRateLimit(socket.id)) return;
      socket.to(`group:${groupId}`).emit("chat:typing", {
        groupId: String(groupId),
        userId,
        userName,
      });
    });

    socket.on("chat:stop-typing", (groupId) => {
      if (!groupId) return;
      socket.to(`group:${groupId}`).emit("chat:stop-typing", {
        groupId: String(groupId),
        userId,
      });
    });

    // ── Reconnect recovery — fetch messages since timestamp ──
    socket.on("chat:messages-since", async ({ groupId, since }, ack) => {
      if (!checkSocketRateLimit(socket.id)) return;
      try {
        if (!groupId || !since) {
          if (typeof ack === "function") ack({ success: false, error: "groupId and since required" });
          return;
        }
        const messages = await chatService.getMessagesSince(groupId, userId, since);
        if (typeof ack === "function") ack({ success: true, messages });
      } catch (err) {
        if (typeof ack === "function") ack({ success: false, error: err.message || "Could not fetch messages" });
      }
    });

    // ── Disconnect cleanup ──
    socket.on("disconnect", () => {
      socketUsers.delete(socket.id);
      socketEventCounts.delete(socket.id);
      // Remove user from all group rooms they were in
      for (const [groupId, users] of roomPresence.entries()) {
        if (users.has(userId)) {
          // Check if user has other sockets still in this room
          const userStillConnected = [...(io.sockets.sockets || new Map()).values()].some(
            (s) => s.id !== socket.id && String(s.user?._id) === userId && s.rooms.has(`group:${groupId}`)
          );
          if (!userStillConnected) {
            users.delete(userId);
            if (users.size === 0) roomPresence.delete(groupId);
            broadcastPresence(groupId);
          }
        }
      }
    });
  });

  return io;
}

function emitToGroup(groupId, eventName, payload) {
  if (!io || !groupId) return;
  io.to(`group:${groupId}`).emit(eventName, payload);
}

function getIo() {
  return io;
}

module.exports = {
  emitToGroup,
  getIo,
  initSocket,
};
