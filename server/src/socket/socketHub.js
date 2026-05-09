let io = null;

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

function initSocket(server, corsOrigin) {
  const { Server } = require("socket.io");
  const jwt = require("jsonwebtoken");
  const Group = require("../models/Group");
  const User = require("../models/User");

  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
    },
  });
  attachRedisAdapter(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication token required"));
      const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_split_chill_secret");
      const user = await User.findById(payload.sub).select("_id name email");
      if (!user) return next(new Error("Authenticated user no longer exists"));
      socket.user = user;
      return next();
    } catch {
      return next(new Error("Socket authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("group:join", async (groupId, ack) => {
      try {
        if (!groupId) return;
        const group = await Group.findOne({ _id: groupId, "members.user": socket.user._id }).select("_id").lean();
        if (!group) {
          if (typeof ack === "function") ack({ success: false, error: "Group access denied" });
          return;
        }
        socket.join(`group:${groupId}`);
        if (typeof ack === "function") ack({ success: true });
      } catch {
        if (typeof ack === "function") ack({ success: false, error: "Could not join group" });
      }
    });

    socket.on("group:leave", (groupId) => {
      if (groupId) socket.leave(`group:${groupId}`);
    });

    socket.on("chat:message", (_payload, ack) => {
      if (typeof ack === "function") {
        ack({ success: false, error: "Use the authenticated chat API to persist messages" });
      }
    });
  });

  return io;
}

function emitToGroup(groupId, eventName, payload) {
  if (!io || !groupId) return;
  io.to(`group:${groupId}`).emit(eventName, payload);
}

module.exports = {
  emitToGroup,
  initSocket,
};
