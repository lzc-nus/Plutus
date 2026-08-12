import {
  notificationsList,
  notificationsUnreadCount,
  notificationsMarkAllRead,
  notificationsMarkOneRead,
} from "@/lib/api/generated";
import { configureApiClient } from "./configureClient";

export async function getNotifications(limit = 30) {
  configureApiClient();
  return notificationsList({ query: { limit } });
}

export async function getUnreadCount() {
  configureApiClient();
  return notificationsUnreadCount();
}

export async function markAllRead() {
  configureApiClient();
  return notificationsMarkAllRead();
}

/**
 * Mark a single notification as read.
 */
export async function markOneRead(notificationId: string) {
  configureApiClient();
  return notificationsMarkOneRead({ path: { notification_id: notificationId } });
}