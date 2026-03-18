const express = require("express");
const Ride = require("../models/Ride");

const router = express.Router();

// CREATE RIDE
router.post("/create", async (req, res) => {
  try {
    const ride = await Ride.create(req.body);

    res.status(201).json({
      message: "Ride created successfully",
      ride
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
    const rides = await Ride.find();

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

    let filter = {};

    if (from) {
      filter.fromLocation = new RegExp(from, "i");
    }

    if (to) {
      filter.toLocation = new RegExp(to, "i");
    }

    const rides = await Ride.find(filter);

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

// GET RIDE BY ID
router.get("/:id", async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

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
    const ride = await Ride.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

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

// DELETE RIDE
router.delete("/:id", async (req, res) => {
  try {
    const ride = await Ride.findByIdAndDelete(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    res.status(200).json({ message: "Ride deleted successfully" });

  } catch (error) {
    res.status(500).json({
      message: "Error deleting ride",
      error: error.message
    });
  }
});

module.exports = router;