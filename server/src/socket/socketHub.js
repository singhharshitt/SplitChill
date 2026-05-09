let io = null;

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
