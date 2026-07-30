import { listNotificationsForUser, markNotificationRead } from "./data-store.service.js";

export async function getNotifications(userContext) {
  return listNotificationsForUser(userContext);
}

export async function readNotification(notificationId, userContext) {
  return markNotificationRead(notificationId, userContext);
}
