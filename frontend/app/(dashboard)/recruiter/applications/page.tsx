"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ListChecks } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { STAGE_LABEL, stageTone } from "@/components/status/stage-meta";
import { useCandidates } from "@/lib/hooks/use-candidates";

export default function RecruiterApplicationsPage() {
  const { data: candidates, isLoading, isError } = useCandidates();
  const rows = useMemo(() => candidates ?? [], [candidates]);

  return (
    <>
      <Topbar title="Applications" subtitle="Every application to your company's jobs" />
      <div className="flex flex-col gap-6 p-8">
        {isLoading && <div className="h-40 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-bg-elevated)]" />}
        {isError && <p className="text-sm text-[var(--color-danger)]">Couldn&apos;t load applications.</p>}
        {!isLoading && rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <ListChecks size={28} className="text-[var(--color-text-faint)]" />
            <p className="text-sm text-[var(--color-text-muted)]">No applications yet.</p>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {rows.map((c) => (
            <Link key={c.id} href={`/recruiter/candidates/${c.id}`}>
              <GlassCard interactive className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">{c.name}</p>
                  <p className="text-xs text-[var(--color-text-faint)]">
                    {c.jobTitle} · {new Date(c.appliedAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs">{c.matchScore}% match</span>
                  <span className="font-mono text-xs">Quiz {c.assessmentScore ?? "—"}</span>
                  <Badge tone={stageTone(c.stage)}>{c.applicationStatus || STAGE_LABEL[c.stage]}</Badge>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
