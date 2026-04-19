const express = require("express");
const Feedback = require("../models/Feedback");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { rideId, fromUserId, toUserId, rating, comment } = req.body;

    if (!rideId || !fromUserId || !toUserId || !rating) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Ensure users cannot rate more than once per ride/direction combination
    const existingFeedback = await Feedback.findOne({
      ride: rideId,
      fromUser: fromUserId,
      toUser: toUserId
    });

    if (existingFeedback) {
      return res.status(400).json({ message: "Feedback already submitted for this user on this ride" });
    }

    const newFeedback = await Feedback.create({
      ride: rideId,
      fromUser: fromUserId,
      toUser: toUserId,
      rating,
      comment
    });

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback: newFeedback
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({
      message: "Error submitting feedback",
      error: error.message
    });
  }
});

module.exports = router;
