const { createAndSendNotification } = require("./notificationService");

// In-memory timers. For production, prefer a persistent job queue.
const scheduledRideEvents = new Map();

const clearRideTimers = (rideId) => {
  const timers = scheduledRideEvents.get(String(rideId));
  if (!timers) return;
  timers.forEach((timerId) => clearTimeout(timerId));
  scheduledRideEvents.delete(String(rideId));
};

const registerTimer = (rideId, timerId) => {
  const key = String(rideId);
  const existing = scheduledRideEvents.get(key) || [];
  existing.push(timerId);
  scheduledRideEvents.set(key, existing);
};

const scheduleRideLifecycleNotifications = async (rideDoc) => {
  if (!rideDoc?.time || !rideDoc?.createdBy) return;

  clearRideTimers(rideDoc._id);

  const now = Date.now();
  const startAt = new Date(rideDoc.time).getTime();
  const reminderAt = startAt - 15 * 60 * 1000;
  const endAt = rideDoc.endTime
    ? new Date(rideDoc.endTime).getTime()
    : startAt + 60 * 60 * 1000;

  const recipients = [String(rideDoc.createdBy)];
  rideDoc.requests
    .filter((request) => request.status === "accepted")
    .forEach((request) => recipients.push(String(request.requester)));

  const uniqueRecipients = [...new Set(recipients)];

  if (reminderAt > now) {
    const reminderTimer = setTimeout(async () => {
      await Promise.all(uniqueRecipients.map((userId) =>
        createAndSendNotification({
          userId,
          type: "ride_reminder",
          title: "Ride starts soon",
          message: `Your ride from ${rideDoc.fromLocation} to ${rideDoc.toLocation} starts in 15 minutes.`,
          meta: { rideId: rideDoc._id }
        })
      ));
    }, reminderAt - now);
    registerTimer(rideDoc._id, reminderTimer);
  }

  if (startAt > now) {
    const startTimer = setTimeout(async () => {
      await Promise.all(uniqueRecipients.map((userId) =>
        createAndSendNotification({
          userId,
          type: "ride_started",
          title: "Ride started",
          message: `Your ride from ${rideDoc.fromLocation} to ${rideDoc.toLocation} has started.`,
          meta: { rideId: rideDoc._id }
        })
      ));
    }, startAt - now);
    registerTimer(rideDoc._id, startTimer);
  }

  if (endAt > now) {
    const endTimer = setTimeout(async () => {
      await Promise.all(uniqueRecipients.map((userId) =>
        createAndSendNotification({
          userId,
          type: "ride_ended",
          title: "Ride ended",
          message: `Your ride from ${rideDoc.fromLocation} to ${rideDoc.toLocation} has ended.`,
          meta: { rideId: rideDoc._id }
        })
      ));
      clearRideTimers(rideDoc._id);
    }, endAt - now);
    registerTimer(rideDoc._id, endTimer);
  }
};

module.exports = {
  scheduleRideLifecycleNotifications,
  clearRideTimers
};
