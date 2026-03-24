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

module.exports = {
  createAndSendNotification
};
