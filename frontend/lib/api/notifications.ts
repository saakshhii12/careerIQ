import { AppNotification } from "@/lib/types/notification";
import { USE_MOCK_API, mockDelay } from "./config";
import { apiClient } from "./client";
import { MOCK_NOTIFICATIONS } from "./mock/notifications";

export async function getNotifications(): Promise<AppNotification[]> {
  if (USE_MOCK_API) return mockDelay([...MOCK_NOTIFICATIONS]);
  return apiClient<AppNotification[]>("/students/me/notifications");
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  if (USE_MOCK_API) {
    const n = MOCK_NOTIFICATIONS.find((n) => n.id === id);
    if (n) n.read = true;
    return mockDelay(n as AppNotification, 150);
  }
  return apiClient<AppNotification>(`/students/me/notifications/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead(): Promise<void> {
  if (USE_MOCK_API) {
    MOCK_NOTIFICATIONS.forEach((n) => (n.read = true));
    return;
  }
  await apiClient("/students/me/notifications/read-all", { method: "POST" });
}
