"use client";

import { Briefcase, Send, MessagesSquare, Mail } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { HiringFunnel } from "@/components/dashboard/recruiter/hiring-funnel";
import { ActiveJobsSummary } from "@/components/dashboard/recruiter/active-jobs-summary";
import { RecentActivity } from "@/components/dashboard/recruiter/recent-activity";
import { useRecruiterDashboard } from "@/lib/hooks/use-recruiter-dashboard";

export default function RecruiterDashboardPage() {
  const { data, isLoading, isError } = useRecruiterDashboard();

  return (
    <>
      <Topbar
        title={data ? `Welcome back, ${data.recruiterName.split(" ")[0]}` : "Dashboard"}
        subtitle={data ? data.companyName : undefined}
      />

      {isLoading && <DashboardSkeleton />}

      {isError && (
        <div className="p-8 text-sm text-[var(--color-danger)]">
          Couldn&apos;t load your dashboard. Try refreshing.
        </div>
      )}

      {data && (
        <div className="flex flex-col gap-6 p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Active jobs" value={data.stats.activeJobs} icon={Briefcase} />
            <StatCard
              label="New applications"
              value={data.stats.newApplications}
              icon={Send}
              trend={{ value: "this week", positive: true }}
            />
            <StatCard label="In interview" value={data.stats.candidatesInInterview} icon={MessagesSquare} />
            <StatCard label="Offers sent" value={data.stats.offersSent} icon={Mail} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <HiringFunnel data={data.hiringFunnel} />
            <RecentActivity activity={data.recentActivity} />
          </div>

          <ActiveJobsSummary jobs={data.activeJobsSummary} />
        </div>
      )}
    </>
  );
}
