"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { RoleGuard } from "@/components/auth/role-guard";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInterview = pathname.startsWith("/student/interview");

  if (isInterview) {
    return <RoleGuard allow={["student"]}>{children}</RoleGuard>;
  }

  return (
    <RoleGuard allow={["student"]}>
      <div className="flex min-h-screen flex-1 bg-[var(--color-bg)]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </RoleGuard>
  );
}
