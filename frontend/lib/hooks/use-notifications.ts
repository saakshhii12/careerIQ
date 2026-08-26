"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api/notifications";
import { AppNotification } from "@/lib/types/notification";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: (id) => {
      queryClient.setQueryData<AppNotification[]>(["notifications"], (old) =>
        old?.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onMutate: () => {
      queryClient.setQueryData<AppNotification[]>(["notifications"], (old) =>
        old?.map((n) => ({ ...n, read: true }))
      );
    },
  });
}
