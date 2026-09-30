"use client";

import { usePathname } from "next/navigation";
import { NotificationMenu } from "./notification-menu";
import { ProfileMenu } from "./profile-menu";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const pathname = usePathname();
  const allHref = pathname.startsWith("/recruiter")
    ? "/recruiter/notifications"
    : pathname.startsWith("/admin")
      ? undefined
      : "/student/notifications";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)] px-6 py-4">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold text-[var(--color-text)]">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-sm text-[var(--color-text-muted)]">{subtitle}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <NotificationMenu allHref={allHref} />
        <ProfileMenu />
      </div>
    </header>
  );
}
