"use client";

import Link from "next/link";
import { ListChecks, ChevronRight } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { PipelineProgress } from "@/components/status/pipeline-progress";
import { STAGE_LABEL, stageTone } from "@/components/status/stage-meta";
import { useMyApplications } from "@/lib/hooks/use-applications";

export default function ApplicationStatusListPage() {
  const { data: applications, isLoading, isError } = useMyApplications();

  return (
    <>
      <Topbar title="My Applications" subtitle="Track every stage, from applied to decision" />

      <div className="flex flex-col gap-5 p-8">
        {isLoading && (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-bg-elevated)]" />
            ))}
          </div>
        )}

        {isError && <div className="text-sm text-[var(--color-danger)]">Couldn&apos;t load applications.</div>}

        {applications && applications.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <ListChecks size={28} className="text-[var(--color-text-faint)]" />
            <p className="text-sm text-[var(--color-text-muted)]">No applications yet.</p>
          </div>
        )}

        {applications?.map((app) => (
          <Link key={app.id} href={`/student/status/${app.id}`}>
            <GlassCard interactive className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-medium text-[var(--color-text)]">{app.jobTitle}</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">{app.company}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge tone={stageTone(app.currentStage)}>{STAGE_LABEL[app.currentStage]}</Badge>
                  <ChevronRight size={16} className="text-[var(--color-text-faint)]" />
                </div>
              </div>
              <PipelineProgress currentStage={app.currentStage} />
            </GlassCard>
          </Link>
        ))}
      </div>
    </>
  );
}
