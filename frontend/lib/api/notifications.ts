import { AppNotification, NotificationType } from "@/lib/types/notification";
import { apiClient } from "./client";

const KNOWN_TYPES: NotificationType[] = [
  "application_submitted",
  "assessment_ready",
  "assessment_passed",
  "assessment_failed",
  "interview_scheduled",
  "interview_completed",
  "application_result",
  "recruiter_message",
  "system",
];

interface BackendNotification {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

function mapNotification(row: BackendNotification): AppNotification {
  return {
    id: row.id,
    type: KNOWN_TYPES.includes(row.type as NotificationType)
      ? (row.type as NotificationType)
      : "system",
    message: row.message,
    read: row.read,
    createdAt: row.createdAt,
    href: row.link,
  };
}

export interface NotificationFeed {
  notifications: AppNotification[];
  unreadCount: number;
}

export async function getNotifications(): Promise<NotificationFeed> {
  const data = await apiClient<{ notifications: BackendNotification[]; unreadCount: number }>(
    "/notifications"
  );
  return {
    notifications: data.notifications.map(mapNotification),
    unreadCount: data.unreadCount,
  };
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const data = await apiClient<{ notification: BackendNotification }>(`/notifications/${id}/read`, {
    method: "POST",
  });
  return mapNotification(data.notification);
}

export async function markAllNotificationsRead(): Promise<number> {
  const data = await apiClient<{ updated: number }>("/notifications/read-all", { method: "POST" });
  return data.updated;
}
