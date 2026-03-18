const mongoose = require("mongoose");

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
  seatsAvailable: {
    type: Number
  }
});

module.exports = mongoose.model("Ride", rideSchema);
