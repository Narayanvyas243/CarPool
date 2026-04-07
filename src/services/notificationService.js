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
    const query = { user: userId, type };
    if (meta.rideId) query["meta.rideId"] = meta.rideId;
    if (meta.requestId) query["meta.requestId"] = meta.requestId;

    await Notification.updateMany(query, { isRead: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
  }
};

module.exports = {
  createAndSendNotification,
  markNotificationsByMetaAsRead
};
