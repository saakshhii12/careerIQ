import { Sidebar, RECRUITER_NAV } from "@/components/layout/sidebar";
import { RoleGuard } from "@/components/auth/role-guard";

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allow={["recruiter"]}>
      <div className="flex min-h-screen flex-1 bg-[var(--color-bg)]">
        <Sidebar nav={RECRUITER_NAV} />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </RoleGuard>
  );
}
