"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Terminal,
  LayoutDashboard,
  FileText,
  Target,
  MessageCircle,
  User,
  Briefcase,
  Users,
  Building2,
  BarChart3,
  ListChecks,
  Bell,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const STUDENT_NAV: NavItem[] = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/applications", label: "Applications", icon: Target },
  { href: "/student/status", label: "My Applications", icon: ListChecks },
  { href: "/student/resume", label: "Resume", icon: FileText },
  { href: "/student/profile", label: "Profile", icon: User },
  { href: "/student/chat", label: "Chat", icon: MessageCircle },
  { href: "/student/notifications", label: "Notifications", icon: Bell },
];

const RECRUITER_NAV: NavItem[] = [
  { href: "/recruiter", label: "Dashboard", icon: LayoutDashboard },
  { href: "/recruiter/jobs", label: "Jobs", icon: Briefcase },
  { href: "/recruiter/candidates", label: "Candidates", icon: Users },
  { href: "/recruiter/company", label: "Company Profile", icon: Building2 },
  { href: "/recruiter/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/recruiter/chat", label: "Chat", icon: MessageCircle },
];

export function Sidebar({ nav = STUDENT_NAV }: { nav?: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[var(--color-bg-primary)]/60 backdrop-blur-lg">
      <Link href="/" className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
          <Terminal size={16} />
        </div>
        <span className="font-mono text-sm font-semibold text-white">careerIQ</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {nav.map((item) => {
          const isRoot = item.href === "/student" || item.href === "/recruiter";
          const active = isRoot ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150",
                active
                  ? "bg-[var(--color-accent)]/12 text-[var(--color-accent)] shadow-[inset_0_0_0_1px_var(--color-accent-soft)]"
                  : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={17} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.06] px-6 py-5">
        <span className="font-mono text-xs text-[var(--color-text-faint)]">v0.1.0 · mock data</span>
      </div>
    </aside>
  );
}

export { STUDENT_NAV, RECRUITER_NAV };
export type { NavItem };
