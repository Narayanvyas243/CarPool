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
    
    // Using a more robust matching strategy for nested meta fields
    // This ensures that whether the IDs were stored/passed as strings or ObjectIds, they match.
    if (meta.rideId) {
      const rideIdObj = mongoose.Types.ObjectId.isValid(meta.rideId) 
        ? new mongoose.Types.ObjectId(meta.rideId) 
        : null;
      
      query["$or"] = query["$or"] || [];
      query["$or"].push({ "meta.rideId": rideIdObj });
      query["$or"].push({ "meta.rideId": String(meta.rideId) });
    }
    
    if (meta.requestId) {
      const requestIdObj = mongoose.Types.ObjectId.isValid(meta.requestId) 
        ? new mongoose.Types.ObjectId(meta.requestId) 
        : null;
      
      query["$or"] = query["$or"] || [];
      query["$or"].push({ "meta.requestId": requestIdObj });
      query["$or"].push({ "meta.requestId": String(meta.requestId) });
    }

    // If no $or was added, simplify query
    const finalQuery = query["$or"] ? query : { user: userId, type, isRead: false };

    const result = await Notification.updateMany(finalQuery, { isRead: true });
    console.log(`[NotificationService] Marked as read: ${result.modifiedCount} notification(s) for user ${userId} (Query Type: ${type})`);
  } catch (error) {
    console.error("Error marking notifications as read:", error);
  }
};

module.exports = {
  createAndSendNotification,
  markNotificationsByMetaAsRead
};
