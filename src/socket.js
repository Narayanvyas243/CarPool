const { Server } = require("socket.io");

let ioInstance = null;
const userSocketMap = new Map();

const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
    }
  });

  ioInstance.on("connection", (socket) => {
    // Client should immediately register with their userId after connect.
    socket.on("register", (userId) => {
      if (!userId) return;
      userSocketMap.set(String(userId), socket.id);
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          break;
        }
      }
    });
  });

  return ioInstance;
};

const getIO = () => ioInstance;

const emitToUser = (userId, eventName, payload) => {
  if (!ioInstance || !userId) return;
  const socketId = userSocketMap.get(String(userId));
  if (!socketId) return;
  ioInstance.to(socketId).emit(eventName, payload);
};

module.exports = {
  initSocket,
  getIO,
  emitToUser
};
