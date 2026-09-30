"use client";

import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Lock,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { StatCard } from "@/components/ui/stat-card";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge, STAGE_META } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { useStudentDashboard } from "@/lib/hooks/use-student-dashboard";
import { useJobs } from "@/lib/hooks/use-jobs";

function greeting(name: string) {
  const hour = new Date().getHours();
  const time = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${time}, ${name.split(" ")[0]}`;
}

function formatAppliedDate(iso: string) {
  const applied = new Date(iso);
  const today = new Date();
  const sameDay =
    applied.getFullYear() === today.getFullYear() &&
    applied.getMonth() === today.getMonth() &&
    applied.getDate() === today.getDate();
  if (sameDay) return "Applied today";
  return `Applied ${applied.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
}

export default function StudentDashboardPage() {
  const { data, isLoading, isError, error } = useStudentDashboard();
  const { data: jobs } = useJobs();

  const matchedJobs = jobs?.filter((job) => !job.applied).slice(0, 4) ?? [];
  const assessmentsPassed = data?.applications.filter((app) => app.quizPassed).length ?? 0;
  const activeInterview = data?.upcomingInterviews.find(
    (interview) => interview.status === "In Progress" || interview.status === "Scheduled"
  );
  const latestInterview = activeInterview ?? data?.upcomingInterviews[0];
  const chatUnlocked = (data?.recruiterChatUnlockedCount ?? 0) > 0;

  return (
    <>
      <Topbar
        title={data ? greeting(data.studentName) : "Dashboard"}
        subtitle={data?.targetRole || undefined}
      />

      {isLoading && <DashboardSkeleton />}

      {isError && (
        <div className="p-6 text-sm text-[var(--color-danger)]">
          {error instanceof Error ? error.message : "Couldn't load your dashboard."}
        </div>
      )}

      {data && (
        <div className="animate-fade-in flex flex-col gap-6 p-6">
          <section>
            <h2 className="text-sm font-medium text-[var(--color-text-muted)]">Your career progress</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard
                label="Profile"
                value={data.profileComplete ? "Complete" : "Incomplete"}
              />
              <StatCard label="Applications" value={data.applications.length} />
              <StatCard label="Open matches" value={matchedJobs.length} />
              <StatCard label="Assessments passed" value={assessmentsPassed} />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <GlassCard className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">
                    Recommended opportunities
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)]">Roles matched to your profile</p>
                </div>
                <Link href="/student/applications">
                  <Button variant="ghost" size="sm">
                    View all jobs <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>
              {matchedJobs.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">
                  No new job matches right now.
                </p>
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {matchedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text)]">{job.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {job.company} · {job.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {job.matchScore != null && (
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {job.matchScore}% match
                          </span>
                        )}
                        <Link href="/student/applications">
                          <Button size="sm" variant="secondary">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            <GlassCard>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Interview</h3>
              {latestInterview ? (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {latestInterview.jobTitle}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">{latestInterview.company}</p>
                  <Badge tone={latestInterview.status === "Completed" ? "success" : "accent"}>
                    {latestInterview.status}
                  </Badge>
                  {latestInterview.overallScore != null && (
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Score: {latestInterview.overallScore}%
                    </p>
                  )}
                  <Link href="/student/status" className="mt-2 inline-block">
                    <Button size="sm" variant="secondary">
                      View application
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                  No interviews yet. Pass a screening assessment to unlock the interview step.
                </p>
              )}
            </GlassCard>
          </div>

          <GlassCard>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Recent applications</h3>
                <p className="text-sm text-[var(--color-text-muted)]">Status straight from your record</p>
              </div>
              <Link href="/student/status">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </div>
            {data.applications.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                You haven&apos;t applied to any roles yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
                      <th className="pb-2 font-medium">Job</th>
                      <th className="pb-2 font-medium">Company</th>
                      <th className="pb-2 font-medium">Applied</th>
                      <th className="pb-2 font-medium">Match</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.applications.slice(0, 6).map((app) => {
                      const meta = STAGE_META[app.stage] ?? STAGE_META.applied;
                      return (
                        <tr
                          key={app.id}
                          className="border-b border-[var(--color-border)] transition-colors last:border-0 hover:bg-[var(--color-bg-muted)]"
                        >
                          <td className="py-2.5 font-medium text-[var(--color-text)]">
                            <Link href={`/student/status/${app.id}`} className="hover:underline">
                              {app.jobTitle}
                            </Link>
                          </td>
                          <td className="py-2.5 text-[var(--color-text-muted)]">{app.company}</td>
                          <td className="py-2.5 text-[var(--color-text-muted)]">
                            {formatAppliedDate(app.updatedAt)}
                          </td>
                          <td className="py-2.5 text-[var(--color-text-muted)]">
                            {app.matchScore != null ? `${app.matchScore}%` : "—"}
                          </td>
                          <td className="py-2.5">
                            <Badge tone={meta.tone}>{meta.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>

          {/* Two distinct communication features. The Career Assistant is AI
              guidance and is always available; recruiter messaging is
              human-to-human and stays locked until a recruiter shortlists you. */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <GlassCard className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <Sparkles size={17} strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">Career Assistant</h3>
                  <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                    Get personalised help with your career, resume, applications and interviews.
                  </p>
                </div>
              </div>
              <Link href="/student/chat" className="mt-auto">
                <Button variant="secondary" className="w-full sm:w-auto">
                  Open Career Assistant <ArrowRight size={14} />
                </Button>
              </Link>
            </GlassCard>

            <GlassCard className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={
                    chatUnlocked
                      ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-success-soft)] text-[var(--color-success)]"
                      : "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-bg-elevated)] text-[var(--color-text-faint)]"
                  }
                >
                  {chatUnlocked ? (
                    <MessageSquare size={17} strokeWidth={1.75} />
                  ) : (
                    <Lock size={17} strokeWidth={1.75} />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">Recruiter Messages</h3>
                  <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                    {chatUnlocked
                      ? `Recruiter communication is available for ${data.recruiterChatUnlockedCount} application${
                          data.recruiterChatUnlockedCount === 1 ? "" : "s"
                        }.`
                      : "Recruiter communication is locked until you pass the AI interview and are shortlisted."}
                  </p>
                </div>
              </div>
              <Link href="/student/messages" className="mt-auto">
                <Button variant={chatUnlocked ? "primary" : "secondary"} className="w-full sm:w-auto">
                  {chatUnlocked ? "Open conversation" : "View status"} <ArrowRight size={14} />
                </Button>
              </Link>
            </GlassCard>
          </div>

          {!data.profileComplete && (
            <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
              <Briefcase size={15} />
              Complete your profile and upload a resume to improve job matching.
              <Link
                href="/student/profile"
                className="ml-auto font-medium text-[var(--color-accent-dim)] hover:underline"
              >
                Go to profile
              </Link>
            </div>
          )}

          {data.profileComplete && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-faint)]">
              <CheckCircle2 size={13} />
              Profile and resume are on file.
            </div>
          )}
        </div>
      )}
    </>
  );
}
