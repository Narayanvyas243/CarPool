const express = require("express");
const cors = require("cors");
const app = express();

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean).map(url => url.replace(/\/$/, ""));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = origin.replace(/\/$/, "");
    const isAllowed = allowedOrigins.includes(normalizedOrigin) || 
                     process.env.NODE_ENV === "development" ||
                     normalizedOrigin.endsWith(".onrender.com");

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());

// Routes
const rideRoutes = require("./routes/rideRoutes");
app.use("/api/rides", rideRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

const feedbackRoutes = require("./routes/feedbackRoutes");
app.use("/api/feedbacks", feedbackRoutes);

const chatRoutes = require("./routes/chatRoutes");
app.use("/api/chat", chatRoutes);

const rideRequestPostRoutes = require("./routes/rideRequestPostRoutes");
app.use("/api/ride-requests", rideRequestPostRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("SmartPool Backend Running");
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err.message);
  
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    message,
    error: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

module.exports = app;
