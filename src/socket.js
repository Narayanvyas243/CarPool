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
      socket.userId = String(userId);
    });

    // Join a private room for a specific ride to share locations
    socket.on("join-ride", (rideId) => {
      if (!rideId) return;
      const room = `ride:${rideId}`;
      socket.join(room);
      console.log(`[Socket] User ${socket.userId || socket.id} joined room ${room}`);
    });

    // Broadcast location to everyone else in the ride room
    socket.on("location-update", ({ rideId, lat, lng, role }) => {
      if (!rideId || !lat || !lng) return;
      const room = `ride:${rideId}`;
      
      // Send to everyone in the room EXCEPT the sender
      socket.to(room).emit("location:received", {
        userId: socket.userId,
        lat,
        lng,
        role, // 'driver' or 'passenger'
        timestamp: new Date()
      });
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
