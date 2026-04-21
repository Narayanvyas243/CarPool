require("dotenv").config();
const connectDB = require("./src/config/db");
const mongoose = require("mongoose");
const User = require("./src/models/User");

async function check() {
  await connectDB();
  const users = await User.find({ phone: "0987654321" });
  console.log("Users with phone:", users.length);
  process.exit();
}
check();
