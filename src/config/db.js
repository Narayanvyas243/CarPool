const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri =
    process.env.MONGO_URI ||
    "mongodb://admin:vyaspapa@localhost:27017/smartpool?authSource=admin";

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log("MongoDB connected to SmartPool DB");
  } catch (error) {
    console.error("MongoDB connection failed", error);
    throw error;
  }
};

module.exports = connectDB;
