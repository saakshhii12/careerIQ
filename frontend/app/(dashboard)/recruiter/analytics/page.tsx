"use client";

import { Clock, ClipboardCheck, Handshake } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { useRecruiterAnalytics } from "@/lib/hooks/use-analytics";

const TOOLTIP_STYLE = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--color-text)",
};

export default function RecruiterAnalyticsPage() {
  const { data, isLoading, isError } = useRecruiterAnalytics();

  return (
    <>
      <Topbar title="Analytics" subtitle="Hiring performance across every open role" />

      {isLoading && <DashboardSkeleton />}
      {isError && <div className="p-8 text-sm text-[var(--color-danger)]">Couldn&apos;t load analytics.</div>}

      {data && (
        <div className="flex flex-col gap-6 p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total applications" value={data.totalApplications} icon={ClipboardCheck} />
            <StatCard
              label="Assessment pass rate"
              value={data.assessmentPassRate != null ? `${data.assessmentPassRate}%` : "Insufficient data"}
              icon={ClipboardCheck}
            />
            <StatCard
              label="Interview completion"
              value={
                data.interviewCompletionRate != null ? `${data.interviewCompletionRate}%` : "Insufficient data"
              }
              icon={Handshake}
            />
            <StatCard
              label="Avg. time to hire"
              value={data.avgTimeToHireDays != null ? `${data.avgTimeToHireDays}d` : "Insufficient data"}
              icon={Clock}
            />
          </div>

          {data.funnel.length > 0 && (
            <GlassCard>
              <h3 className="text-sm font-medium text-[var(--color-text)]">Hiring funnel</h3>
              <p className="text-sm text-[var(--color-text-muted)]">Counts from your company&apos;s applications.</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {data.funnel.map((step) => (
                  <div key={step.stage} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-center">
                    <p className="font-mono text-lg text-[var(--color-text)]">{step.count}</p>
                    <p className="text-xs text-[var(--color-text-faint)]">{step.stage}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GlassCard className="flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-[var(--color-text)]">Applications &amp; hires, last 6 weeks</h3>
                <p className="text-sm text-[var(--color-text-muted)]">Volume trend across all active jobs.</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.weeklyTrend} margin={{ left: -16, right: 8 }}>
                    <defs>
                      <linearGradient id="appsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="week" tick={{ fill: "var(--color-text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--color-text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "var(--color-text)" }} />
                    <Area type="monotone" dataKey="applications" stroke="var(--color-accent)" fill="url(#appsGradient)" strokeWidth={2} />
                    <Area type="monotone" dataKey="hires" stroke="var(--color-text-muted)" fill="none" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-[var(--color-text)]">Top skills in demand</h3>
                <p className="text-sm text-[var(--color-text-muted)]">Across all applicants to your open roles.</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topSkillsInDemand} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "var(--color-text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="skill" width={90} tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      labelStyle={{ color: "var(--color-text)" }}
                      cursor={{ fill: "var(--color-bg-muted)" }}
                    />
                    <Bar dataKey="count" fill="var(--color-accent)" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </>
  );
}
