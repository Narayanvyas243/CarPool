require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");
  try {
    const user1 = new User({
      name: "T2", email: "t2@stu.upes.ac.in", password: "p", role: "student", gender: "male", phone: "0000000000"
    });
    // await user1.save(); // assuming saved once
    console.log(await user1.validate());
  } catch(e) {
    console.error("Error:", e.message);
  }
  process.exit();
}
run();
