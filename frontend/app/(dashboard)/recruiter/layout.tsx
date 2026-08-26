import { Sidebar, RECRUITER_NAV } from "@/components/layout/sidebar";

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar nav={RECRUITER_NAV} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
