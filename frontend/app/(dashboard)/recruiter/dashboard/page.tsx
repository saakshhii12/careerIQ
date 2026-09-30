"use client";

import Link from "next/link";
import {
  Briefcase,
  Users,
  ClipboardCheck,
  CheckCircle2,
  Video,
  Star,
  XCircle,
  Clock3,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { HiringFunnel } from "@/components/dashboard/recruiter/hiring-funnel";
import { ActiveJobsSummary } from "@/components/dashboard/recruiter/active-jobs-summary";
import { RecentActivity } from "@/components/dashboard/recruiter/recent-activity";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { useRecruiterDashboard } from "@/lib/hooks/use-recruiter-dashboard";

function greeting(name: string) {
  const first = name.split(" ")[0] || "there";
  return `Welcome back, ${first}`;
}

export default function RecruiterDashboardPage() {
  const { data, isLoading, isError } = useRecruiterDashboard();

  return (
    <>
      <Topbar
        title={data ? greeting(data.recruiterName) : "Dashboard"}
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Active jobs" value={data.stats.activeJobs} icon={Briefcase} />
            <StatCard label="Total applicants" value={data.stats.totalApplicants} icon={Users} />
            <StatCard label="In quiz" value={data.stats.candidatesInQuiz} icon={ClipboardCheck} />
            <StatCard label="Quiz passed" value={data.stats.quizPassed} icon={CheckCircle2} />
            <StatCard label="In AI interview" value={data.stats.candidatesInInterview} icon={Video} />
            <StatCard label="Interviews completed" value={data.stats.interviewsCompleted} icon={Video} />
            <StatCard label="Shortlisted" value={data.stats.shortlisted} icon={Star} />
            <StatCard label="Rejected" value={data.stats.rejected} icon={XCircle} />
            <StatCard label="Pending reviews" value={data.stats.pendingReviews} icon={Clock3} />
          </div>

          <GlassCard className="!p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <h3 className="text-sm font-medium text-[var(--color-text)]">Recent applications</h3>
                <p className="text-sm text-[var(--color-text-muted)]">Live counts from your company&apos;s jobs</p>
              </div>
              <Link href="/recruiter/applications" className="text-xs font-medium text-[var(--color-accent)]">
                View all
              </Link>
            </div>
            {data.recentApplications.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[var(--color-text-muted)]">No applications yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-[var(--color-border)] text-xs text-[var(--color-text-faint)]">
                    <tr>
                      <th className="px-5 py-2.5 font-medium">Candidate</th>
                      <th className="px-3 py-2.5 font-medium">Job</th>
                      <th className="px-3 py-2.5 font-medium">Match</th>
                      <th className="px-3 py-2.5 font-medium">Quiz</th>
                      <th className="px-3 py-2.5 font-medium">Interview</th>
                      <th className="px-5 py-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {data.recentApplications.map((row) => (
                      <tr key={row.id} className="hover:bg-[var(--color-bg-muted)]">
                        <td className="px-5 py-3">
                          <Link href={`/recruiter/candidates/${row.id}`} className="font-medium text-[var(--color-text)]">
                            {row.candidateName}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-[var(--color-text-muted)]">{row.jobTitle}</td>
                        <td className="px-3 py-3 font-mono text-xs">{row.matchScore}%</td>
                        <td className="px-3 py-3 font-mono text-xs">{row.quizScore != null ? `${row.quizScore}%` : "—"}</td>
                        <td className="px-3 py-3 font-mono text-xs">
                          {row.interviewScore != null ? `${row.interviewScore}%` : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone="neutral">{row.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>

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
