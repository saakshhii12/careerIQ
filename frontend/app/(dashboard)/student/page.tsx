"use client";

import { FileText, Send, Trophy, Flame } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { StatCard } from "@/components/ui/stat-card";
import { ScoreCard } from "@/components/dashboard/score-card";
import { SkillGapChart } from "@/components/dashboard/skill-gap-chart";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { ApplicationsList } from "@/components/dashboard/applications-list";
import { RoadmapTimeline } from "@/components/dashboard/roadmap-timeline";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { useStudentDashboard } from "@/lib/hooks/use-student-dashboard";

export default function StudentDashboardPage() {
  const { data, isLoading, isError } = useStudentDashboard();

  return (
    <>
      <Topbar
        title={data ? `Welcome back, ${data.studentName.split(" ")[0]}` : "Dashboard"}
        subtitle={data ? `Targeting: ${data.targetRole}` : undefined}
        unreadCount={data?.notifications.filter((n) => !n.read).length}
      />

      {isLoading && <DashboardSkeleton />}

      {isError && (
        <div className="p-8 text-sm text-[var(--color-danger)]">
          Couldn&apos;t load your dashboard. Try refreshing.
        </div>
      )}

      {data && (
        <div className="flex flex-col gap-6 p-8">
          <ScoreCard score={data.score} />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <StatCard label="Active applications" value={data.applications.length} icon={Send} />
            <StatCard label="Assessments passed" value={2} icon={Trophy} trend={{ value: "+1 this week", positive: true }} />
            <StatCard label="Roadmap streak" value="6 weeks" icon={Flame} trend={{ value: "on track", positive: true }} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SkillGapChart data={data.skillGaps} />
            <ActivityChart data={data.weeklyActivity} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ApplicationsList applications={data.applications} />
            <RoadmapTimeline milestones={data.roadmap} />
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--color-text-faint)]">
            <FileText size={13} />
            Resume last analyzed 2 days ago — upload a new version to refresh your CareerIQ score.
          </div>
        </div>
      )}
    </>
  );
}
