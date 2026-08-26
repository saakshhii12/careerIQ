"use client";

import Link from "next/link";
import { CheckCheck, Bell } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NOTIFICATION_META } from "@/lib/notification-meta";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/lib/hooks/use-notifications";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsPage() {
  const { data: notifications, isLoading, isError } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <>
      <Topbar title="Notifications" subtitle={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"} />

      <div className="flex flex-col gap-6 p-8">
        <div className="flex justify-end">
          <Button size="sm" variant="secondary" onClick={() => markAllRead.mutate()} disabled={unreadCount === 0}>
            <CheckCheck size={14} /> Mark all as read
          </Button>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-[var(--radius-card)] bg-white/[0.04]" />
            ))}
          </div>
        )}

        {isError && <div className="text-sm text-[var(--color-danger)]">Couldn&apos;t load notifications.</div>}

        {notifications && notifications.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Bell size={28} className="text-[var(--color-text-faint)]" />
            <p className="text-sm text-[var(--color-text-muted)]">No notifications yet.</p>
          </div>
        )}

        {notifications && notifications.length > 0 && (
          <GlassCard className="!p-0 overflow-hidden">
            <div className="flex flex-col divide-y divide-white/[0.06]">
              {notifications.map((n) => {
                const meta = NOTIFICATION_META[n.type];
                const Icon = meta.icon;
                const content = (
                  <div
                    className={cn(
                      "flex items-start gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03]",
                      !n.read && "bg-[var(--color-accent)]/[0.04]"
                    )}
                    onClick={() => !n.read && markRead.mutate(n.id)}
                  >
                    <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]", meta.tone)}>
                      <Icon size={16} strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{n.title}</p>
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />}
                      </div>
                      <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{n.body}</p>
                      <span className="mt-1 block text-xs text-[var(--color-text-faint)]">{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                );
                return n.href ? (
                  <Link key={n.id} href={n.href} className="block cursor-pointer">
                    {content}
                  </Link>
                ) : (
                  <div key={n.id} className="cursor-pointer">
                    {content}
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}
      </div>
    </>
  );
}
