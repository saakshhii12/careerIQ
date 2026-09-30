import { Sidebar, ADMIN_NAV } from "@/components/layout/sidebar";
import { RoleGuard } from "@/components/auth/role-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allow={["admin"]}>
      <div className="flex min-h-screen flex-1 bg-[var(--color-bg)]">
        <Sidebar nav={ADMIN_NAV} />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </RoleGuard>
  );
}
