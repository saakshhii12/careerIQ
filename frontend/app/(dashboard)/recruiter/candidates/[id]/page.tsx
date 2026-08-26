"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Check, X, Clock3, ThumbsUp, ThumbsDown } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STAGE_LABEL, stageTone } from "@/components/status/stage-meta";
import { useCandidate, useDecideCandidate } from "@/lib/hooks/use-candidates";

function ScoreBlock({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-[var(--color-text-faint)]">{label}</span>
      {value !== undefined ? (
        <>
          <span className="font-mono text-2xl text-white">{value}%</span>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${value}%` }} />
          </div>
        </>
      ) : (
        <span className="text-sm text-[var(--color-text-faint)]">Not yet reached</span>
      )}
    </div>
  );
}

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: candidate, isLoading, isError } = useCandidate(id);
  const decideMutation = useDecideCandidate();

  const decided = candidate && ["accepted", "rejected", "waitlisted"].includes(candidate.stage);

  return (
    <>
      <Topbar title={candidate ? candidate.name : "Candidate"} subtitle={candidate?.jobTitle} />

      <div className="flex flex-col gap-6 p-8">
        <Link
          href="/recruiter/candidates"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-white"
        >
          <ArrowLeft size={14} /> Back to candidates
        </Link>

        {isLoading && <div className="h-80 animate-pulse rounded-[var(--radius-card)] bg-white/[0.04]" />}
        {isError && <div className="text-sm text-[var(--color-danger)]">Couldn&apos;t load this candidate.</div>}
        {!isLoading && !candidate && <div className="text-sm text-[var(--color-text-muted)]">Candidate not found.</div>}

        {candidate && (
          <>
            <GlassCard glow className="flex flex-col gap-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)]/12 font-mono text-base font-semibold text-[var(--color-accent)]">
                    {candidate.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{candidate.name}</h2>
                    <p className="text-sm text-[var(--color-text-muted)]">Applied for {candidate.jobTitle}</p>
                  </div>
                </div>
                <Badge tone={stageTone(candidate.stage)}>{STAGE_LABEL[candidate.stage]}</Badge>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[var(--color-text-muted)]">
                <FileText size={15} />
                {candidate.resumeFileName}
                <Button size="sm" variant="ghost" className="ml-auto">
                  View resume
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-6 border-t border-white/[0.06] pt-5 sm:grid-cols-3">
                <ScoreBlock label="Resume match (SBERT)" value={candidate.matchScore} />
                <ScoreBlock label="Assessment score" value={candidate.assessmentScore} />
                <ScoreBlock label="Interview score" value={candidate.interviewScore} />
              </div>
            </GlassCard>

            {(candidate.interviewSummary || candidate.strengths || candidate.weaknesses) && (
              <GlassCard className="flex flex-col gap-5">
                <h3 className="text-sm font-medium text-white">AI interview report</h3>
                {candidate.interviewSummary && (
                  <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{candidate.interviewSummary}</p>
                )}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {candidate.strengths && (
                    <div>
                      <span className="text-xs font-medium text-[var(--color-success)]">Strengths</span>
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {candidate.strengths.map((s) => (
                          <li key={s} className="text-sm text-[var(--color-text-muted)]">
                            · {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {candidate.weaknesses && (
                    <div>
                      <span className="text-xs font-medium text-[var(--color-warning)]">Areas of concern</span>
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {candidate.weaknesses.map((w) => (
                          <li key={w} className="text-sm text-[var(--color-text-muted)]">
                            · {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            <GlassCard className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-medium text-white">Decision</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {decided
                    ? "This candidate's outcome has been recorded."
                    : "The AI recommends based on scores — the final call is always yours."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  disabled={decideMutation.isPending || candidate.stage === "accepted"}
                  onClick={() => decideMutation.mutate({ id: candidate.id, decision: "accept" })}
                >
                  <ThumbsUp size={15} /> Accept
                </Button>
                <Button
                  variant="secondary"
                  disabled={decideMutation.isPending || candidate.stage === "waitlisted"}
                  onClick={() => decideMutation.mutate({ id: candidate.id, decision: "waitlist" })}
                >
                  <Clock3 size={15} /> Waitlist
                </Button>
                <Button
                  variant="danger"
                  disabled={decideMutation.isPending || candidate.stage === "rejected"}
                  onClick={() => decideMutation.mutate({ id: candidate.id, decision: "reject" })}
                >
                  <ThumbsDown size={15} /> Reject
                </Button>
              </div>
              {decided && (
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-faint)]">
                  {candidate.stage === "accepted" && <Check size={13} className="text-[var(--color-success)]" />}
                  {candidate.stage === "rejected" && <X size={13} className="text-[var(--color-danger)]" />}
                  {candidate.stage === "waitlisted" && <Clock3 size={13} className="text-[var(--color-warning)]" />}
                  Chat with this candidate {candidate.stage === "accepted" ? "is now unlocked." : "unlocks upon acceptance."}
                </div>
              )}
            </GlassCard>
          </>
        )}
      </div>
    </>
  );
}
