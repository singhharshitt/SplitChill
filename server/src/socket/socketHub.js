let io = null;

function initSocket(server, corsOrigin) {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("group:join", (groupId) => {
      if (groupId) socket.join(`group:${groupId}`);
    });

    socket.on("group:leave", (groupId) => {
      if (groupId) socket.leave(`group:${groupId}`);
    });

    socket.on("chat:message", (payload) => {
      if (payload?.groupId) {
        io.to(`group:${payload.groupId}`).emit("chat:message", payload);
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
