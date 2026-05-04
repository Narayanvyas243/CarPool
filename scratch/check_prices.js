const mongoose = require("mongoose");
require("dotenv").config();
const Ride = require("../src/models/Ride");

const checkRides = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const rides = await Ride.find().limit(5);
    console.log(JSON.stringify(rides, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkRides();
