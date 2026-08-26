"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { PipelineProgress } from "@/components/status/pipeline-progress";
import { STAGE_LABEL, stageTone } from "@/components/status/stage-meta";
import { useApplication } from "@/lib/hooks/use-applications";

export default function ApplicationStatusDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: app, isLoading, isError } = useApplication(id);

  return (
    <>
      <Topbar title={app ? app.jobTitle : "Application"} subtitle={app?.company} />

      <div className="flex flex-col gap-6 p-8">
        <Link
          href="/student/status"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-white"
        >
          <ArrowLeft size={14} /> Back to all applications
        </Link>

        {isLoading && <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-white/[0.04]" />}
        {isError && <div className="text-sm text-[var(--color-danger)]">Couldn&apos;t load this application.</div>}
        {!isLoading && !app && (
          <div className="text-sm text-[var(--color-text-muted)]">Application not found.</div>
        )}

        {app && (
          <>
            <GlassCard glow className="flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">{app.jobTitle}</h2>
                  <p className="text-sm text-[var(--color-text-muted)]">{app.company}</p>
                </div>
                <Badge tone={stageTone(app.currentStage)}>{STAGE_LABEL[app.currentStage]}</Badge>
              </div>

              <PipelineProgress currentStage={app.currentStage} />

              <div className="flex flex-wrap gap-6 border-t border-white/[0.06] pt-5">
                <div>
                  <span className="text-xs text-[var(--color-text-faint)]">Match score</span>
                  <p className="font-mono text-lg text-white">{app.matchScore}%</p>
                </div>
                {app.assessmentScore !== undefined && (
                  <div>
                    <span className="text-xs text-[var(--color-text-faint)]">Assessment score</span>
                    <p className="font-mono text-lg text-white">{app.assessmentScore}%</p>
                  </div>
                )}
              </div>

              {app.decisionReason && (
                <div className="flex items-start gap-3 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/6 px-4 py-3.5">
                  <Info size={16} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
                  <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{app.decisionReason}</p>
                </div>
              )}
            </GlassCard>

            <GlassCard className="flex flex-col">
              <h3 className="mb-4 text-sm font-medium text-white">Timeline</h3>
              <div className="flex flex-col">
                {app.timeline.map((event, i) => (
                  <div key={i} className="flex gap-3 pb-5 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
                      {i < app.timeline.length - 1 && <div className="mt-1 h-full min-h-6 w-px bg-white/[0.08]" />}
                    </div>
                    <div>
                      <p className="text-sm text-white">{STAGE_LABEL[event.stage]}</p>
                      {event.note && <p className="text-xs text-[var(--color-text-muted)]">{event.note}</p>}
                      <p className="mt-0.5 text-xs text-[var(--color-text-faint)]">
                        {new Date(event.occurredAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </>
  );
}
