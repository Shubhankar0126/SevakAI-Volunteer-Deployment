import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";
import { getNotifications, readNotification } from "../services/notification.service.js";
import { emitNotificationUpdated } from "../socket/index.js";

export const list = asyncHandler(async (request, response) => {
  sendSuccess(response, await getNotifications(request.auth));
});

export const markRead = asyncHandler(async (request, response) => {
  const notification = await readNotification(request.params.notificationId, request.auth);
  emitNotificationUpdated({ reason: "notification-read", notificationId: notification.id });
  sendSuccess(response, notification, "Notification marked as read.");
});
