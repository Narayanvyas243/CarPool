const express = require("express");
const RideRequestPost = require("../models/RideRequestPost");
const User = require("../models/User");

const router = express.Router();

// GET all open ride requests
router.get("/", async (req, res) => {
  try {
    const expirationThreshold = new Date(Date.now() - 60 * 60 * 1000); // Only future or very recent requests
    const posts = await RideRequestPost.find({
      status: "open",
      time: { $gt: expirationThreshold }
    }).populate("requester", "name role gender phone").sort({ time: 1 });
    
    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({ message: "Error fetching requests", error: error.message });
  }
});

// POST a new ride request
router.post("/", async (req, res) => {
  try {
    const { requester, fromLocation, toLocation, time, seatsNeeded } = req.body;
    
    if (!requester || !fromLocation || !toLocation || !time) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const post = await RideRequestPost.create({
      requester,
      fromLocation,
      toLocation,
      time,
      seatsNeeded
    });

    const populatedPost = await RideRequestPost.findById(post._id).populate("requester", "name role gender phone");

    res.status(201).json({ message: "Request posted successfully", post: populatedPost });
  } catch (error) {
    res.status(500).json({ message: "Error posting request", error: error.message });
  }
});

// PATCH to close/fulfill a request
router.patch("/:id/fulfill", async (req, res) => {
  try {
    const post = await RideRequestPost.findByIdAndUpdate(
      req.params.id,
      { status: "fulfilled" },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.status(200).json({ message: "Request fulfilled", post });
  } catch (error) {
    res.status(500).json({ message: "Error fulfilling request", error: error.message });
  }
});

module.exports = router;
