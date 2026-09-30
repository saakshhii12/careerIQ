"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { NOTIFICATION_META, relativeTime } from "@/lib/notification-meta";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/lib/hooks/use-notifications";

/**
 * Notification bell. Reads real rows from the notifications table via
 * /api/notifications and persists read state on click.
 */
export function NotificationMenu({ allHref }: { allHref?: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data, isLoading, isError, error } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text)]",
          open && "bg-[var(--color-bg-elevated)] text-[var(--color-text)]"
        )}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-in absolute right-0 top-10 z-50 w-[22rem] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <span className="text-sm font-medium text-[var(--color-text)]">Notifications</span>
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={unreadCount === 0 || markAllRead.isPending}
              className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-text)] disabled:opacity-40"
            >
              <CheckCheck size={13} /> Mark all read
            </button>
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {isLoading && (
              <div className="flex flex-col gap-2 p-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="h-12 animate-pulse rounded-md bg-[var(--color-bg-elevated)]" />
                ))}
              </div>
            )}

            {isError && (
              <p className="px-4 py-6 text-sm text-[var(--color-danger)]">
                {error instanceof Error ? error.message : "Couldn't load notifications."}
              </p>
            )}

            {!isLoading && !isError && notifications.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Bell size={22} className="text-[var(--color-text-faint)]" />
                <p className="text-sm text-[var(--color-text-muted)]">No notifications yet.</p>
              </div>
            )}

            {notifications.map((notification) => {
              const meta = NOTIFICATION_META[notification.type];
              const Icon = meta.icon;
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    if (!notification.read) markRead.mutate(notification.id);
                    setOpen(false);
                    if (notification.href) router.push(notification.href);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-[var(--color-border)] px-4 py-3 text-left transition-colors last:border-0 hover:bg-[var(--color-bg-muted)]",
                    !notification.read && "bg-[var(--color-accent-soft)]"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-bg-muted)]",
                      meta.tone
                    )}
                  >
                    <Icon size={14} strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2">
                      <span className="text-sm leading-snug text-[var(--color-text)]">
                        {notification.message}
                      </span>
                      {!notification.read && (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                      )}
                    </span>
                    <span className="mt-1 block text-xs text-[var(--color-text-faint)]">
                      {meta.label} · {relativeTime(notification.createdAt)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {allHref && notifications.length > 0 && (
            <Link
              href={allHref}
              onClick={() => setOpen(false)}
              className="block border-t border-[var(--color-border)] px-4 py-3 text-center text-xs font-medium text-[var(--color-accent-dim)] transition hover:bg-[var(--color-bg-muted)]"
            >
              View all notifications
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
