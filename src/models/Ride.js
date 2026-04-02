const mongoose = require("mongoose");

// Each student/faculty seat request is stored here.
const rideRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  seatsRequested: {
    type: Number,
    default: 1,
    min: 1
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  },
  requestedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const rideSchema = new mongoose.Schema({
  fromLocation: {
    type: String,
    required: true
  },
  toLocation: {
    type: String,
    required: true
  },
  fromCoords: {
    lat: Number,
    lng: Number
  },
  toCoords: {
    lat: Number,
    lng: Number
  },
  time: {
    type: Date
  },
  endTime: {
    type: Date
  },
  seatsAvailable: {
    type: Number,
    required: true,
    min: 1
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // Keeps all incoming booking requests for this ride.
  requests: {
    type: [rideRequestSchema],
    default: []
  }
});

module.exports = mongoose.model("Ride", rideSchema);
