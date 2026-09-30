"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Building2, FileText, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

interface MenuLink {
  href: string;
  label: string;
  icon: typeof User;
}

const STUDENT_LINKS: MenuLink[] = [
  { href: "/student/profile", label: "My profile", icon: User },
  { href: "/student/resume", label: "Resume", icon: FileText },
];

const RECRUITER_LINKS: MenuLink[] = [
  { href: "/recruiter/company", label: "Company profile", icon: Building2 },
];

/**
 * Avatar button in the top bar. Opens the authenticated user's own profile —
 * the name, email, and initials all come from the verified session, never from
 * a hard-coded candidate.
 */
export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  const initials =
    user?.full_name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const links = user?.role === "recruiter" ? RECRUITER_LINKS : STUDENT_LINKS;
  const primaryHref = links[0]?.href ?? "/";

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
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-xs font-medium text-[var(--color-text-muted)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]",
          open && "border-[var(--color-accent)] text-[var(--color-text)]"
        )}
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-in absolute right-0 top-10 z-50 w-60 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]"
        >
          <Link
            href={primaryHref}
            onClick={() => setOpen(false)}
            className="block border-b border-[var(--color-border)] px-4 py-3 transition hover:bg-[var(--color-bg-muted)]"
          >
            <p className="truncate text-sm font-medium text-[var(--color-text)]">
              {user?.full_name ?? "Your account"}
            </p>
            <p className="truncate text-xs text-[var(--color-text-faint)]">{user?.email}</p>
          </Link>

          <div className="p-1.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text)]"
              >
                <link.icon size={15} strokeWidth={1.75} />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-[var(--color-border)] p-1.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text)]"
            >
              <LogOut size={15} strokeWidth={1.75} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
