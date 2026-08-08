"use client";

import { Clock, ClipboardCheck, Handshake } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { useRecruiterAnalytics } from "@/lib/hooks/use-analytics";

export default function RecruiterAnalyticsPage() {
  const { data, isLoading, isError } = useRecruiterAnalytics();

  return (
    <>
      <Topbar title="Analytics" subtitle="Hiring performance across every open role" />

      {isLoading && <DashboardSkeleton />}
      {isError && <div className="p-8 text-sm text-[var(--color-danger)]">Couldn&apos;t load analytics.</div>}

      {data && (
        <div className="flex flex-col gap-6 p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <StatCard label="Avg. time to hire" value={`${data.avgTimeToHireDays}d`} icon={Clock} />
            <StatCard label="Assessment pass rate" value={`${data.assessmentPassRate}%`} icon={ClipboardCheck} />
            <StatCard label="Offer acceptance rate" value={`${data.offerAcceptanceRate}%`} icon={Handshake} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GlassCard className="flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-white">Applications &amp; hires, last 6 weeks</h3>
                <p className="text-sm text-[var(--color-text-muted)]">Volume trend across all active jobs.</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.weeklyTrend} margin={{ left: -16, right: 8 }}>
                    <defs>
                      <linearGradient id="appsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="week" tick={{ fill: "var(--color-text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--color-text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#20365d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }}
                      labelStyle={{ color: "white" }}
                    />
                    <Area type="monotone" dataKey="applications" stroke="var(--color-accent)" fill="url(#appsGradient)" strokeWidth={2} />
                    <Area type="monotone" dataKey="hires" stroke="#ffffff" fill="none" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-white">Top skills in demand</h3>
                <p className="text-sm text-[var(--color-text-muted)]">Across all applicants to your open roles.</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topSkillsInDemand} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "var(--color-text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="skill" width={90} tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#20365d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }}
                      labelStyle={{ color: "white" }}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    />
                    <Bar dataKey="count" fill="var(--color-accent)" radius={[0, 6, 6, 0]} barSize={16} />
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
