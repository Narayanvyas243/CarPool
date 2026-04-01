const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// Routes
const rideRoutes = require("./routes/rideRoutes");
app.use("/api/rides", rideRoutes);

// User routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

// Notification routes
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("SmartPool Backend Running");
});

module.exports = app;
