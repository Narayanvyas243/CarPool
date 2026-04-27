require("dotenv").config();
const connectDB = require("../src/config/db");
const Ride = require("../src/models/Ride");
const User = require("../src/models/User");

const RIDE_POPULATE = [
  { path: "createdBy", select: "name email role gender phone upiId" },
  { path: "requests.requester", select: "name email role gender phone upiId" }
];

async function check() {
  try {
    await connectDB();
    console.log("Connected to DB");
    
    const count = await Ride.countDocuments();
    console.log("Total Rides:", count);
    
    if (count > 0) {
      const rides = await Ride.find().sort({ createdAt: -1 }).limit(3).populate(RIDE_POPULATE);
      console.log("Last 3 Rides (Populated):");
      rides.forEach(r => {
        console.log(`- ID: ${r._id}`);
        console.log(`  Driver: ${r.createdBy?.name} (Gender: ${r.createdBy?.gender}, UPI: ${r.createdBy?.upiId})`);
        console.log(`  Price: ${r.price}`);
        console.log(`  Coords: From(${r.fromCoords?.lat}, ${r.fromCoords?.lng}) To(${r.toCoords?.lat}, ${r.toCoords?.lng})`);
        console.log(`  Requests: ${r.requests.length}`);
        r.requests.forEach(req => {
            console.log(`    - Requester: ${req.requester?.name} (Status: ${req.status}, Gender: ${req.requester?.gender})`);
        });
      });
    }
    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
