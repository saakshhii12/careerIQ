"use client";

import { Bell, Search } from "lucide-react";

export function Topbar({
  title,
  subtitle,
  unreadCount = 0,
  userInitials = "AR",
}: {
  title: string;
  subtitle?: string;
  unreadCount?: number;
  userInitials?: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/[0.06] bg-[var(--color-bg)]/70 px-8 py-5 backdrop-blur-lg">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--color-text-muted)]">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm text-[var(--color-text-faint)] md:flex">
          <Search size={15} />
          <span>Quick search…</span>
        </div>

        <button
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[var(--color-text-muted)] transition-colors hover:text-white"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-semibold text-[#0b1424]">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent)]/15 text-xs font-semibold text-[var(--color-accent)]">
          {userInitials}
        </div>
      </div>
    </header>
  );
}
