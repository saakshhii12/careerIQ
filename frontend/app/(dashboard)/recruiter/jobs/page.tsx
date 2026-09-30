"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Briefcase, Pause, Play, XCircle, Users } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecruiterJob } from "@/lib/types/recruiter-job";
import { useRecruiterJobs, useSetRecruiterJobStatus } from "@/lib/hooks/use-recruiter-jobs";
import { cn } from "@/lib/utils";

const STATUS_META: Record<RecruiterJob["status"], { label: string; tone: "success" | "warning" | "neutral" }> = {
  open: { label: "Open", tone: "success" },
  paused: { label: "Paused", tone: "warning" },
  closed: { label: "Closed", tone: "neutral" },
};

const FILTERS = ["all", "open", "paused", "closed"] as const;
type Filter = (typeof FILTERS)[number];

export default function RecruiterJobsPage() {
  const { data: jobs, isLoading, isError } = useRecruiterJobs();
  const statusMutation = useSetRecruiterJobStatus();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = jobs?.filter((j) => filter === "all" || j.status === filter) ?? [];

  return (
    <>
      <Topbar title="Jobs" subtitle="Manage every role you've posted" />

      <div className="flex flex-col gap-6 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all duration-150",
                  filter === f ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <Link href="/recruiter/jobs/new">
            <Button size="sm">
              <Plus size={15} /> Post a job
            </Button>
          </Link>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-bg-elevated)]" />
            ))}
          </div>
        )}

        {isError && <div className="text-sm text-[var(--color-danger)]">Couldn&apos;t load jobs.</div>}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Briefcase size={28} className="text-[var(--color-text-faint)]" />
            <p className="text-sm text-[var(--color-text-muted)]">No {filter !== "all" ? filter : ""} jobs.</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {filtered.map((job) => {
            const meta = STATUS_META[job.status];
            return (
              <GlassCard key={job.id} className="flex flex-wrap items-center justify-between gap-4">
                <Link href={`/recruiter/jobs/${job.id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="truncate text-base font-medium text-[var(--color-text)] hover:text-[var(--color-accent)]">
                      {job.title}
                    </h3>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {job.department} · {job.location}
                  </p>
                </Link>

                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
                    <Users size={14} />
                    {job.applicantsCount} applicants
                  </span>
                  <span className="text-sm text-[var(--color-text-muted)]">{job.qualifiedCount ?? 0} qualified</span>
                  <span className="text-sm text-[var(--color-text-muted)]">{job.interviewsCount ?? 0} interviews</span>
                  <span className="text-sm text-[var(--color-text-muted)]">{job.shortlistedCount ?? 0} shortlisted</span>

                  <div className="flex gap-2">
                    {job.status === "open" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => statusMutation.mutate({ id: job.id, status: "paused" })}
                      >
                        <Pause size={13} /> Pause
                      </Button>
                    )}
                    {job.status === "paused" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => statusMutation.mutate({ id: job.id, status: "open" })}
                      >
                        <Play size={13} /> Resume
                      </Button>
                    )}
                    {job.status !== "closed" && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => statusMutation.mutate({ id: job.id, status: "closed" })}
                      >
                        <XCircle size={13} /> Close
                      </Button>
                    )}
                    {job.status === "closed" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => statusMutation.mutate({ id: job.id, status: "open" })}
                      >
                        <Play size={13} /> Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </>
  );
}
