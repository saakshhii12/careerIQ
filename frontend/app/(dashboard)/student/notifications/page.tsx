"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NOTIFICATION_META, relativeTime } from "@/lib/notification-meta";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/lib/hooks/use-notifications";

export default function NotificationsPage() {
  const { data, isLoading, isError, error } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <>
      <Topbar
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
      />

      <div className="flex flex-col gap-6 p-6">
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => markAllRead.mutate()}
            disabled={unreadCount === 0 || markAllRead.isPending}
          >
            <CheckCheck size={14} /> Mark all as read
          </Button>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-bg-elevated)]"
              />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-sm text-[var(--color-danger)]">
            {error instanceof Error ? error.message : "Couldn't load notifications."}
          </div>
        )}

        {!isLoading && !isError && notifications.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Bell size={26} className="text-[var(--color-text-faint)]" />
            <p className="text-sm text-[var(--color-text-muted)]">No notifications yet.</p>
          </div>
        )}

        {notifications.length > 0 && (
          <GlassCard className="!p-0 overflow-hidden">
            <div className="flex flex-col divide-y divide-[var(--color-border)]">
              {notifications.map((notification) => {
                const meta = NOTIFICATION_META[notification.type];
                const Icon = meta.icon;
                const content = (
                  <div
                    className={cn(
                      "flex items-start gap-4 px-5 py-4 transition-colors hover:bg-[var(--color-bg-muted)]",
                      !notification.read && "bg-[var(--color-accent-soft)]"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-bg-muted)]",
                        meta.tone
                      )}
                    >
                      <Icon size={16} strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <p className="text-sm leading-snug text-[var(--color-text)]">
                          {notification.message}
                        </p>
                        {!notification.read && (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                        )}
                      </div>
                      <span className="mt-1 block text-xs text-[var(--color-text-faint)]">
                        {meta.label} · {relativeTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                );

                return notification.href ? (
                  <Link
                    key={notification.id}
                    href={notification.href}
                    onClick={() => !notification.read && markRead.mutate(notification.id)}
                    className="block"
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => !notification.read && markRead.mutate(notification.id)}
                    className="block w-full text-left"
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          </GlassCard>
        )}
      </div>
    </>
  );
}
