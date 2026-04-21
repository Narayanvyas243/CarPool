const { Server } = require("socket.io");

let ioInstance = null;
const userSocketMap = new Map();
// Tracks last proximity check time: "userId:rideId" -> timestamp
const lastProximityCheckMap = new Map();

// Helper to calculate distance between two coordinates in meters (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) *
    Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

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
    socket.on("location-update", async ({ rideId, lat, lng, role }) => {
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

      // --- NEW: Automatic Ride Completion Prompt Logic (with Throttling) ---
      try {
        const checkKey = `${socket.userId}:${rideId}`;
        const lastCheck = lastProximityCheckMap.get(checkKey) || 0;
        const now = Date.now();

        // Only check every 10 seconds to avoid hammering the DB
        if (now - lastCheck < 10000) return;
        lastProximityCheckMap.set(checkKey, now);

        const Ride = require("./models/Ride");
        const ride = await Ride.findById(rideId);
        if (!ride || !ride.toCoords) return;

        const distance = calculateDistance(lat, lng, ride.toCoords.lat, ride.toCoords.lng);
        // If within 300m of destination
        if (distance < 300) {
          const { createAndSendNotification } = require("./services/notificationService");
          
          if (role === 'passenger') {
            const request = ride.requests.find(r => String(r.requester) === String(socket.userId));
            if (request && request.isOnboarded && !request.isCompleted) {
              // We only send the persistent notification once (isCompletionPromptSent)
              // but we can emit the socket event multiple times (throttled)
              if (!request.isCompletionPromptSent) {
                request.isCompletionPromptSent = true;
                await ride.save();

                const promptPayload = {
                  type: "ride_completion_verify",
                  title: "Destination Reached? 🏁",
                  message: "It looks like you've reached the destination. Has your ride been completed?",
                  meta: { rideId: ride._id, requestId: request._id }
                };

                await createAndSendNotification({ ...promptPayload, userId: ride.createdBy });
                await createAndSendNotification({ ...promptPayload, userId: request.requester });
              }

              // Always emit socket event (throttled by 10s above) to ensure popup shows
              ioInstance.to(room).emit("ride:confirm-completion", {
                rideId: ride._id,
                requestId: request._id,
                passengerId: request.requester
              });

              console.log(`[Socket] Completion prompt emitted (by passenger) for ride ${rideId}, passenger ${socket.userId}`);
            }
          } else if (role === 'driver') {
            // If the driver reaches the destination, trigger for all onboarded passengers
            let updated = false;
            for (const request of ride.requests) {
              if (request.isOnboarded && !request.isCompleted) {
                 if (!request.isCompletionPromptSent) {
                    request.isCompletionPromptSent = true;
                    updated = true;

                    const promptPayload = {
                      type: "ride_completion_verify",
                      title: "Destination Reached? 🏁",
                      message: "It looks like you've reached the destination. Has the passenger completed their ride?",
                      meta: { rideId: ride._id, requestId: request._id }
                    };

                    await createAndSendNotification({ ...promptPayload, userId: ride.createdBy });
                    await createAndSendNotification({ ...promptPayload, userId: request.requester });
                 }

                // Always emit socket event (throttled)
                ioInstance.to(room).emit("ride:confirm-completion", {
                  rideId: ride._id,
                  requestId: request._id,
                  passengerId: request.requester
                });

                console.log(`[Socket] Completion prompt emitted (by driver) for ride ${rideId}, passenger ${request.requester}`);
              }
            }
            if (updated) await ride.save();
          }
        }
      } catch (err) {
        console.error("[Socket] Error in completion prompt logic:", err);
      }
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
