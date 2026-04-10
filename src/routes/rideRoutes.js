const express = require("express");
const Ride = require("../models/Ride");
const User = require("../models/User");
const { 
  createAndSendNotification,
  markNotificationsByMetaAsRead
} = require("../services/notificationService");
const {
  scheduleRideLifecycleNotifications,
  clearRideTimers
} = require("../services/rideEventScheduler");

const router = express.Router();
const RIDE_POPULATE = [
  { path: "createdBy", select: "name email role gender phone" },
  { path: "requests.requester", select: "name email role gender phone" }
];

// CREATE RIDE
router.post("/create", async (req, res) => {
  try {
    const { createdBy } = req.body;

    if (!createdBy) {
      return res.status(400).json({
        message: "createdBy (user id) is required"
      });
    }

    const user = await User.findById(createdBy);
    if (!user) {
      return res.status(404).json({
        message: "User not found for this ride"
      });
    }

    const rideTime = new Date(req.body.time);
    const now = new Date();

    // Allow a 1-minute buffer for form submission time and network latency.
    if (rideTime < new Date(now.getTime() - 60000)) {
      return res.status(400).json({
        message: "Cannot create a ride for a past date or time"
      });
    }

    const ride = await Ride.create(req.body);
    const populatedRide = await Ride.findById(ride._id).populate(RIDE_POPULATE);
    await scheduleRideLifecycleNotifications(populatedRide);

    res.status(201).json({
      message: "Ride created successfully",
      ride: populatedRide
    });

  } catch (error) {
    res.status(500).json({
      message: "Error creating ride",
      error: error.message
    });
  }
});

// GET ALL RIDES
router.get("/all", async (req, res) => {
  try {
    // Show rides that started up to 30 minutes ago.
    const expirationThreshold = new Date(Date.now() - 30 * 60 * 1000);
    const rides = await Ride.find({
      time: { $gt: expirationThreshold }
    }).populate(RIDE_POPULATE);

    res.status(200).json({
      message: "Rides fetched successfully",
      rides
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching rides",
      error: error.message
    });
  }
});

// SEARCH RIDES BY LOCATION
router.get("/search", async (req, res) => {
  try {
    const { from, to } = req.query;
    const expirationThreshold = new Date(Date.now() - 30 * 60 * 1000);

    let filter = {
      time: { $gt: expirationThreshold }
    };

    if (from) {
      filter.fromLocation = new RegExp(from, "i");
    }

    if (to) {
      filter.toLocation = new RegExp(to, "i");
    }

    const rides = await Ride.find(filter).populate(RIDE_POPULATE);

    res.status(200).json({
      message: "Filtered rides fetched successfully",
      rides
    });

  } catch (error) {
    res.status(500).json({
      message: "Error searching rides",
      error: error.message
    });
  }
});

// MY RIDES DASHBOARD
// Keep this route above "/:id" so "dashboard" is not treated as a ride id.
// Returns:
// 1) rides created by me
// 2) rides where my request got accepted (booked rides)
// 3) pending requests received on my created rides
router.get("/dashboard/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();
    const mongoose = require("mongoose");
    const objId = new mongoose.Types.ObjectId(userId);

    const createdRides = await Ride.find({ createdBy: objId }).populate(RIDE_POPULATE);

    const bookedRides = await Ride.find({
      requests: { $elemMatch: { requester: objId, status: "accepted" } }
    }).populate(RIDE_POPULATE);

    const pastBookedRides = bookedRides.filter(ride => new Date(ride.time) < now);
    const upcomingBookedRides = bookedRides.filter(ride => new Date(ride.time) >= now);

    console.log(`[Dashboard] User: ${userId}`);
    console.log(`[Dashboard] Total Booked: ${bookedRides.length}`);
    console.log(`[Dashboard] Past: ${pastBookedRides.length}`);
    console.log(`[Dashboard] Upcoming: ${upcomingBookedRides.length}`);

    // Pending requests the ride owner needs to approve/reject.
    const ownerRidesWithPending = await Ride.find({
      createdBy: userId,
      "requests.status": "pending"
    }).populate(RIDE_POPULATE);

    const pendingRequests = ownerRidesWithPending.flatMap((ride) =>
      ride.requests
        .filter((request) => request.status === "pending")
        .map((request) => ({
          rideId: ride._id,
          fromLocation: ride.fromLocation,
          toLocation: ride.toLocation,
          time: ride.time,
          seatsRequested: request.seatsRequested,
          requestId: request._id,
          requester: request.requester
        }))
    );

    // [Auto-Cleanup] Mark notifications as read for any requests that have already been 
    // processed (accepted/rejected) or are being shown here.
    // This solves the 'persistent notification' bug.
    const processedRides = createdRides.filter(r => r.requests.some(req => req.status !== 'pending'));
    for (const ride of processedRides) {
      for (const req of ride.requests) {
        if (req.status !== 'pending') {
          await markNotificationsByMetaAsRead(userId, "ride_request_received", {
            rideId: ride._id,
            requestId: req._id
          });
        }
      }
    }

    res.status(200).json({
      message: "Dashboard fetched successfully",
      dashboard: {
        createdRides,
        bookedRides, 
        pastBookedRides,
        upcomingBookedRides,
        pendingRequests
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching dashboard",
      error: error.message
    });
  }
});

// GET RIDE BY ID
router.get("/:id", async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate(RIDE_POPULATE);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    res.status(200).json(ride);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching ride",
      error: error.message
    });
  }
});

// UPDATE RIDE
router.put("/:id", async (req, res) => {
  try {
    if (req.body.createdBy) {
      const user = await User.findById(req.body.createdBy);
      if (!user) {
        return res.status(404).json({
          message: "User not found for this ride"
        });
      }
    }

    const ride = await Ride.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate(RIDE_POPULATE);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    await scheduleRideLifecycleNotifications(ride);

    res.status(200).json({
      message: "Ride updated successfully",
      ride
    });

  } catch (error) {
    res.status(500).json({
      message: "Error updating ride",
      error: error.message
    });
  }
});

// REQUEST A SEAT ON A RIDE
router.post("/:rideId/request", async (req, res) => {
  try {
    const { requesterId, seatsRequested = 1 } = req.body;
    const { rideId } = req.params;

    if (!requesterId) {
      return res.status(400).json({ message: "requesterId is required" });
    }

    const requester = await User.findById(requesterId);
    if (!requester) {
      return res.status(404).json({ message: "Requester not found" });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Driver should not request seat in their own ride.
    if (String(ride.createdBy) === String(requesterId)) {
      return res.status(400).json({ message: "Ride owner cannot request own ride" });
    }

    const hasPendingOrAccepted = ride.requests.some(
      (r) =>
        String(r.requester) === String(requesterId) &&
        ["pending", "accepted"].includes(r.status)
    );
    if (hasPendingOrAccepted) {
      return res.status(400).json({
        message: "You already have a pending/accepted request for this ride"
      });
    }

    ride.requests.push({
      requester: requesterId,
      seatsRequested: Number(seatsRequested) || 1
    });

    await ride.save();
    const updatedRide = await Ride.findById(ride._id).populate(RIDE_POPULATE);

    // Notify the ride owner that a new request has arrived.
    await createAndSendNotification({
      userId: ride.createdBy,
      type: "ride_request_received",
      title: "New ride request",
      message: `${requester.name} requested ${Number(seatsRequested) || 1} seat(s) for your ride.`,
      meta: { rideId: ride._id, requestId: ride.requests[ride.requests.length - 1]._id }
    });

    // Notify the requester that their request has been submitted.
    await createAndSendNotification({
      userId: requesterId,
      type: "ride_request_received",
      title: "Ride request sent",
      message: `You have requested ${Number(seatsRequested) || 1} seat(s) for the ride to ${ride.toLocation}.`,
      meta: { rideId: ride._id, requestId: ride.requests[ride.requests.length - 1]._id }
    });

    res.status(201).json({
      message: "Ride request submitted successfully",
      ride: updatedRide
    });
  } catch (error) {
    res.status(500).json({
      message: "Error submitting ride request",
      error: error.message
    });
  }
});

// ACCEPT OR REJECT A RIDE REQUEST (ONLY RIDE OWNER)
router.patch("/:rideId/requests/:requestId", async (req, res) => {
  try {
    const { rideId, requestId } = req.params;
    const { action, ownerId } = req.body;

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ message: "action must be accept or reject" });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (!ownerId || String(ride.createdBy) !== String(ownerId)) {
      return res.status(403).json({ message: "Only ride owner can manage requests" });
    }

    // Use string-safe matching so both ObjectId/string formats work reliably.
    const normalizedRequestId = String(requestId).trim();
    const request = ride.requests.find(
      (r) => String(r._id) === normalizedRequestId
    );
    if (!request) {
      return res.status(404).json({
        message: "Request not found",
        availableRequestIds: ride.requests.map((r) => String(r._id))
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Only pending requests can be updated" });
    }

    if (action === "accept") {
      // Protect against overbooking at acceptance time.
      if (ride.seatsAvailable < request.seatsRequested) {
        return res.status(400).json({ message: "Not enough seats available" });
      }
      request.status = "accepted";
      ride.seatsAvailable -= request.seatsRequested;
    } else {
      request.status = "rejected";
    }

    await ride.save();
    const updatedRide = await Ride.findById(ride._id).populate(RIDE_POPULATE);
    await scheduleRideLifecycleNotifications(updatedRide);

    // Notify requester about final owner decision.
    await createAndSendNotification({
      userId: request.requester,
      type: action === "accept" ? "ride_request_accepted" : "ride_request_rejected",
      title: action === "accept" ? "Ride request accepted" : "Ride request rejected",
      message:
        action === "accept"
          ? `Your request was accepted for ride ${ride.fromLocation} to ${ride.toLocation}.`
          : `Your request was rejected for ride ${ride.fromLocation} to ${ride.toLocation}.`,
      meta: { rideId: ride._id, requestId: request._id }
    });
    
    // Mark the original "ride_request_received" notification as read for the ride owner.
    await markNotificationsByMetaAsRead(
      ride.createdBy, 
      "ride_request_received", 
      { rideId: ride._id, requestId: request._id }
    );

    res.status(200).json({
      message: `Request ${action}ed successfully`,
      ride: updatedRide
    });
  } catch (error) {
    console.error("Error in PATCH ride request:", error);
    res.status(500).json({
      message: "Error updating ride request",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// DELETE RIDE (CANCEL RIDE)
router.delete("/:id", async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Notify all requesters (accepted or pending) that the ride is cancelled.
    const notificationPromises = ride.requests.map(request => {
      return createAndSendNotification({
        userId: request.requester,
        type: "ride_request_rejected", // Re-using rejected type for cancellation
        title: "Ride Cancelled",
        message: `The ride from ${ride.fromLocation} to ${ride.toLocation} has been cancelled by the owner.`,
        meta: { rideId: ride._id }
      });
    });

    await Promise.all(notificationPromises);

    await Ride.findByIdAndDelete(req.params.id);
    clearRideTimers(req.params.id);

    res.status(200).json({ message: "Ride deleted successfully" });

  } catch (error) {
    res.status(500).json({
      message: "Error deleting ride",
      error: error.message
    });
  }
});

module.exports = router;