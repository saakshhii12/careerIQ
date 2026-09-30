"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  NotificationFeed,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";
import { useAuth } from "@/providers/auth-provider";

/** Notifications belong to a user, so both roles use this hook. */
export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.user_id],
    queryFn: getNotifications,
    enabled: Boolean(user),
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      queryClient.setQueriesData<NotificationFeed>({ queryKey: ["notifications"] }, (old) =>
        old
          ? {
              notifications: old.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
              unreadCount: Math.max(0, old.unreadCount - 1),
            }
          : old
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onMutate: async () => {
      queryClient.setQueriesData<NotificationFeed>({ queryKey: ["notifications"] }, (old) =>
        old ? { notifications: old.notifications.map((n) => ({ ...n, read: true })), unreadCount: 0 } : old
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
