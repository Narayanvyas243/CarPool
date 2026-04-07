const Notification = require("../models/Notification");
const { emitToUser } = require("../socket");

const createAndSendNotification = async ({
  userId,
  type,
  title,
  message,
  meta = {}
}) => {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    meta
  });

  emitToUser(String(userId), "notification:new", notification);
  return notification;
};

const markNotificationsByMetaAsRead = async (userId, type, meta) => {
  try {
    const mongoose = require("mongoose");
    const query = { user: userId, type, isRead: false };
    
    // Explicitly handle nested meta fields with potential ObjectId casting
    if (meta.rideId) {
      query["meta.rideId"] = mongoose.Types.ObjectId.isValid(meta.rideId) 
        ? new mongoose.Types.ObjectId(meta.rideId) 
        : meta.rideId;
    }
    
    if (meta.requestId) {
      query["meta.requestId"] = mongoose.Types.ObjectId.isValid(meta.requestId) 
        ? new mongoose.Types.ObjectId(meta.requestId) 
        : meta.requestId;
    }

    const result = await Notification.updateMany(query, { isRead: true });
    console.log(`[NotificationService] Marked as read: ${result.modifiedCount} notification(s) for user ${userId}`);
  } catch (error) {
    console.error("Error marking notifications as read:", error);
  }
};

module.exports = {
  createAndSendNotification,
  markNotificationsByMetaAsRead
};
