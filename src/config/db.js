const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("CRITICAL ERROR: MONGO_URI is not defined in environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    console.log("✅ MongoDB connected successfully to Atlas/Local");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error; // Re-throw to be handled by the server startup logic
  }
};

module.exports = connectDB;
