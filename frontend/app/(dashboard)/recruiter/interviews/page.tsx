"use client";

import Link from "next/link";
import { Video } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { useCandidates } from "@/lib/hooks/use-candidates";

export default function RecruiterInterviewsPage() {
  const { data: candidates, isLoading, isError } = useCandidates();
  const rows = (candidates ?? []).filter((c) => c.interviewStatus);

  return (
    <>
      <Topbar title="Interviews" subtitle="AI interview results from stored evaluations" />
      <div className="flex flex-col gap-6 p-8">
        {isLoading && <div className="h-40 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-bg-elevated)]" />}
        {isError && <p className="text-sm text-[var(--color-danger)]">Couldn&apos;t load interviews.</p>}
        {!isLoading && rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Video size={28} className="text-[var(--color-text-faint)]" />
            <p className="text-sm text-[var(--color-text-muted)]">No AI interviews yet.</p>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {rows.map((c) => (
            <Link key={c.id} href={`/recruiter/candidates/${c.id}`}>
              <GlassCard interactive className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">{c.name}</p>
                  <p className="text-xs text-[var(--color-text-faint)]">{c.jobTitle}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs">
                    Overall {c.interviewScore != null ? `${c.interviewScore}%` : "—"}
                  </span>
                  <Badge tone={c.interviewStatus === "Completed" ? "accent" : "neutral"}>
                    {c.interviewStatus}
                  </Badge>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
