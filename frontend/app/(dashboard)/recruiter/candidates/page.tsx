"use client";

import { useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { STAGE_LABEL, stageTone } from "@/components/status/stage-meta";
import { ApplicationStage } from "@/lib/types/application";
import { useCandidates } from "@/lib/hooks/use-candidates";
import { cn } from "@/lib/utils";

const FILTERS: (ApplicationStage | "all")[] = [
  "all",
  "applied",
  "matched",
  "assessment",
  "interview",
  "review",
  "accepted",
  "waitlisted",
  "rejected",
];

export default function CandidatesPage() {
  const { data: candidates, isLoading, isError } = useCandidates();
  const [filter, setFilter] = useState<ApplicationStage | "all">("all");

  const filtered = candidates?.filter((c) => filter === "all" || c.stage === filter) ?? [];

  return (
    <>
      <Topbar title="Candidates" subtitle="Every applicant across your open roles" />

      <div className="flex flex-col gap-6 p-8">
        <div className="flex flex-wrap gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-all duration-150",
                filter === f ? "bg-[var(--color-accent)] text-[#0b1424]" : "text-[var(--color-text-muted)] hover:text-white"
              )}
            >
              {f === "all" ? "All" : STAGE_LABEL[f]}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-[var(--radius-card)] bg-white/[0.04]" />
            ))}
          </div>
        )}

        {isError && <div className="text-sm text-[var(--color-danger)]">Couldn&apos;t load candidates.</div>}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Users size={28} className="text-[var(--color-text-faint)]" />
            <p className="text-sm text-[var(--color-text-muted)]">No candidates at this stage.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {filtered.map((c) => (
            <Link key={c.id} href={`/recruiter/candidates/${c.id}`}>
              <GlassCard interactive className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/12 font-mono text-xs font-semibold text-[var(--color-accent)]">
                    {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{c.name}</p>
                    <p className="truncate text-xs text-[var(--color-text-faint)]">{c.jobTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-[var(--color-text-muted)]">{c.matchScore}% match</span>
                  <Badge tone={stageTone(c.stage)}>{STAGE_LABEL[c.stage]}</Badge>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
