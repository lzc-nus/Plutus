import {
  notificationsList,
  notificationsUnreadCount,
  notificationsMarkAllRead,
  notificationsMarkOneRead,
} from "@/lib/api/generated";
import { configureApiClient } from "./configureClient";

/**
 * Fetches the most recent notifications for the authenticated user.
 */
export async function getNotifications(limit = 30) {
  configureApiClient();
  return notificationsList({ query: { limit } });
}

/**
 * Returns the number of unread notifications for the authenticated user.
 */
export async function getUnreadCount() {
  configureApiClient();
  return notificationsUnreadCount();
}

/**
 * Marks all unread notifications as read.
 */
export async function markAllRead() {
  configureApiClient();
  return notificationsMarkAllRead();
}

/**
 * Marks a single notification as read.
 */
export async function markOneRead(notificationId: string) {
  configureApiClient();
  return notificationsMarkOneRead({ path: { notification_id: notificationId } });
}