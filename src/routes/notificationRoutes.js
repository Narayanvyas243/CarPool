const express = require("express");
const Notification = require("../models/Notification");
const User = require("../models/User");

const router = express.Router();

// GET USER NOTIFICATIONS
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      message: "Notifications fetched successfully",
      notifications
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching notifications",
      error: error.message
    });
  }
});

// MARK A NOTIFICATION AS READ
router.patch("/:notificationId/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      message: "Notification marked as read",
      notification
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating notification",
      error: error.message
    });
  }
});

module.exports = router;
