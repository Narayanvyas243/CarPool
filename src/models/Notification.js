const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: [
      "ride_request_received",
      "ride_request_accepted",
      "ride_request_rejected",
      "ride_reminder",
      "ride_started",
      "ride_ended"
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  meta: {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride"
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
