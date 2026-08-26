"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Badge, STAGE_META } from "@/components/ui/badge";
import { ApplicationSummary } from "@/lib/types/student";

export function ApplicationsList({ applications }: { applications: ApplicationSummary[] }) {
  return (
    <GlassCard className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">Recent applications</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Live status across every role you&apos;ve applied to.</p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-white/[0.06]">
        {applications.map((app) => {
          const meta = STAGE_META[app.stage];
          return (
            <div key={app.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{app.jobTitle}</p>
                <p className="truncate text-xs text-[var(--color-text-faint)]">{app.company}</p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="font-mono text-xs text-[var(--color-text-muted)]">
                  {app.matchScore}% match
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
