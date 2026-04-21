require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");
  try {
    const indexes = await User.collection.indexes();
    console.log("Indexes:", indexes);
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit();
}
run();
