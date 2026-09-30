"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  ListChecks,
  MessageSquare,
  Sparkles,
  User,
  Users,
  Building2,
  Bell,
  Settings,
  Star,
  Video,
  LogOut,
  Route,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Career Assistant (AI guidance) and Recruiter Messages (human, shortlist-gated)
// are separate entries on purpose — neither is labelled just "Chat".
const STUDENT_NAV: NavItem[] = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/applications", label: "Jobs", icon: Briefcase },
  { href: "/student/status", label: "Applications", icon: ListChecks },
  { href: "/student/profile", label: "Profile", icon: User },
  { href: "/student/resume", label: "Resume", icon: FileText },
  { href: "/student/roadmap", label: "Roadmap", icon: Route },
  { href: "/student/chat", label: "Career Assistant", icon: Sparkles },
  { href: "/student/messages", label: "Recruiter Messages", icon: MessageSquare },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Recruiter allotment", icon: Users },
];

const RECRUITER_NAV: NavItem[] = [
  { href: "/recruiter/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/recruiter/jobs", label: "Jobs", icon: Briefcase },
  { href: "/recruiter/candidates", label: "Candidates", icon: Users },
  { href: "/recruiter/applications", label: "Applications", icon: ListChecks },
  { href: "/recruiter/interviews", label: "Interviews", icon: Video },
  { href: "/recruiter/shortlisted", label: "Shortlisted", icon: Star },
  { href: "/recruiter/messages", label: "Messages", icon: MessageSquare },
  { href: "/recruiter/notifications", label: "Notifications", icon: Bell },
  { href: "/recruiter/company", label: "Company Profile", icon: Building2 },
  { href: "/recruiter/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ nav = STUDENT_NAV }: { nav?: NavItem[] }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-primary)]">
      <Link href="/" className="flex items-center gap-2.5 border-b border-[var(--color-border)] px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-accent)] text-xs font-bold text-white">
          CQ
        </div>
        <span className="text-sm font-semibold text-[var(--color-text)]">CareerIQ</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {nav.map((item) => {
          const isRoot =
            item.href === "/student" ||
            item.href === "/recruiter/dashboard" ||
            item.href === "/admin";
          const active = isRoot
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--color-accent-soft)] font-medium text-[var(--color-accent-dim)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text)]"
              )}
            >
              <item.icon size={16} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-border)] p-4">
        {user && (
          <div className="mb-3">
            <p className="truncate text-sm font-medium text-[var(--color-text)]">{user.full_name}</p>
            <p className="truncate text-xs text-[var(--color-text-faint)]">{user.email}</p>
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text)]"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export { STUDENT_NAV, RECRUITER_NAV, ADMIN_NAV };
export type { NavItem };
