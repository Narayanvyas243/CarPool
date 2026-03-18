const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb://admin:vyaspapa@localhost:27017/smartpool?authSource=admin"
    );
    console.log("MongoDB connected to SmartPool DB");
  } catch (error) {
    console.error("MongoDB connection failed", error);
  }
};

module.exports = connectDB;
