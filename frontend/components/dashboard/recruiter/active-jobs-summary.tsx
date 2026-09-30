"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { RecruiterActiveJob } from "@/lib/types/recruiter";

const STATUS_META: Record<RecruiterActiveJob["status"], { label: string; tone: "success" | "warning" | "neutral" }> = {
  open: { label: "Open", tone: "success" },
  paused: { label: "Paused", tone: "warning" },
  closed: { label: "Closed", tone: "neutral" },
  archived: { label: "Archived", tone: "neutral" },
};

export function ActiveJobsSummary({ jobs }: { jobs: RecruiterActiveJob[] }) {
  return (
    <GlassCard className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[var(--color-text)]">Active jobs</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Applicant volume across every open role.</p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-[var(--color-border)]">
        {jobs.map((job) => {
          const meta = STATUS_META[job.status];
          return (
            <div key={job.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--color-text)]">{job.title}</p>
                <p className="truncate text-xs text-[var(--color-text-faint)]">{job.department}</p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="font-mono text-xs text-[var(--color-text-muted)]">
                  {job.applicants} applicants
                  {job.newApplicants > 0 && (
                    <span className="text-[var(--color-accent)]"> · +{job.newApplicants} new</span>
                  )}
                </span>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
