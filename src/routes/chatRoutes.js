const express = require("express");
const Message = require("../models/Message");
const Ride = require("../models/Ride");

const router = express.Router();

// GET all messages for a specific ride
router.get("/:rideId", async (req, res) => {
  try {
    const messages = await Message.find({ rideId: req.params.rideId })
      .populate("sender", "name role")
      .sort({ timestamp: 1 });
    
    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error: error.message });
  }
});

// POST a new message
router.post("/:rideId", async (req, res) => {
  try {
    const { sender, text } = req.body;
    
    if (!sender || !text) {
      return res.status(400).json({ message: "Sender and text are required" });
    }

    // Verify ride exists
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    const message = await Message.create({
      rideId: req.params.rideId,
      sender,
      text
    });

    const populatedMessage = await Message.findById(message._id).populate("sender", "name role");

    res.status(201).json({ message: populatedMessage });
  } catch (error) {
    res.status(500).json({ message: "Error posting message", error: error.message });
  }
});

module.exports = router;
