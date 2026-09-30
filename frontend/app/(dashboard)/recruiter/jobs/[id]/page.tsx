"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, MapPin, Briefcase, Users } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STAGE_LABEL, stageTone } from "@/components/status/stage-meta";
import { useRecruiterJob } from "@/lib/hooks/use-recruiter-jobs";
import { useCandidates } from "@/lib/hooks/use-candidates";

const STATUS_TONE = { open: "success", paused: "warning", closed: "neutral" } as const;

export default function RecruiterJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: job, isLoading } = useRecruiterJob(id);
  const { data: candidates } = useCandidates();

  const applicants = useMemo(() => {
    const list = candidates?.filter((c) => c.jobId === id) ?? [];
    return [...list].sort((a, b) => {
      const matchDiff = b.matchScore - a.matchScore;
      if (matchDiff !== 0) return matchDiff;
      return (b.interviewScore ?? -1) - (a.interviewScore ?? -1);
    });
  }, [candidates, id]);

  return (
    <>
      <Topbar title={job ? job.title : "Job"} subtitle={job ? `${job.department} · ${job.location}` : undefined} />

      <div className="flex flex-col gap-6 p-8">
        <div className="flex items-center justify-between">
          <Link
            href="/recruiter/jobs"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <ArrowLeft size={14} /> Back to jobs
          </Link>
          {job && (
            <Link href={`/recruiter/jobs/${id}/edit`}>
              <Button size="sm" variant="secondary">
                <Pencil size={13} /> Edit job
              </Button>
            </Link>
          )}
        </div>

        {isLoading && <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-bg-elevated)]" />}

        {job && (
          <>
            <GlassCard className="flex flex-col gap-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text)]">{job.title}</h2>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1.5"><MapPin size={13} /> {job.location}</span>
                    <span className="flex items-center gap-1.5"><Briefcase size={13} /> {job.experienceLevel}</span>
                  </p>
                </div>
                <Badge tone={STATUS_TONE[job.status]}>{job.status}</Badge>
              </div>

              <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{job.description}</p>

              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((s) => (
                  <Badge key={s} tone="neutral">{s}</Badge>
                ))}
              </div>

              {job.responsibilities.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-[var(--color-text-faint)]">Responsibilities</span>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {job.responsibilities.map((r) => (
                      <li key={r} className="text-sm text-[var(--color-text-muted)]">· {r}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-t border-[var(--color-border)] pt-5 text-center sm:grid-cols-4">
                <div>
                  <span className="font-mono text-lg text-[var(--color-text)]">{job.applicantsCount}</span>
                  <p className="text-xs text-[var(--color-text-faint)]">Applicants</p>
                </div>
                <div>
                  <span className="font-mono text-lg text-[var(--color-text)]">{job.qualifiedCount ?? 0}</span>
                  <p className="text-xs text-[var(--color-text-faint)]">Qualified</p>
                </div>
                <div>
                  <span className="font-mono text-lg text-[var(--color-text)]">{job.interviewsCount ?? 0}</span>
                  <p className="text-xs text-[var(--color-text-faint)]">Interviews</p>
                </div>
                <div>
                  <span className="font-mono text-lg text-[var(--color-text)]">{job.shortlistedCount ?? 0}</span>
                  <p className="text-xs text-[var(--color-text-faint)]">Shortlisted</p>
                </div>
              </div>
              {job.pipeline && (
                <div className="grid grid-cols-2 gap-2 border-t border-[var(--color-border)] pt-5 text-xs sm:grid-cols-4">
                  <p>Applied: {job.pipeline.applied}</p>
                  <p>Quiz required: {job.pipeline.quizRequired}</p>
                  <p>Quiz passed: {job.pipeline.quizPassed}</p>
                  <p>AI interview: {job.pipeline.aiInterview}</p>
                  <p>Under review: {job.pipeline.underReview}</p>
                  <p>Shortlisted: {job.pipeline.shortlisted}</p>
                  <p>Rejected: {job.pipeline.rejected}</p>
                </div>
              )}
            </GlassCard>

            <GlassCard className="flex flex-col">
              <div className="mb-4 flex items-center gap-2">
                <Users size={16} className="text-[var(--color-text-muted)]" />
                <h3 className="text-sm font-medium text-[var(--color-text)]">
                  Ranked pipeline ({applicants.length})
                </h3>
                <p className="text-xs text-[var(--color-text-faint)]">
                  Sorted by skill match, then quiz and interview scores (overlap-based matching).
                </p>
              </div>

              {applicants.length === 0 && (
                <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">No applicants yet.</p>
              )}

              <div className="flex flex-col divide-y divide-[var(--color-border)]">
                {applicants.map((c, index) => (
                  <Link
                    key={c.id}
                    href={`/recruiter/candidates/${c.id}`}
                    className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0 hover:bg-[var(--color-bg-muted)]"
                  >
                    <span className="text-sm text-[var(--color-text)]">
                      #{index + 1} {c.name}
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-xs text-[var(--color-text-muted)]">{c.matchScore}% match</span>
                      <span className="font-mono text-xs text-[var(--color-text-muted)]">
                        Quiz {c.assessmentScore ?? "—"}
                      </span>
                      <span className="font-mono text-xs text-[var(--color-text-muted)]">
                        Interview {c.interviewScore ?? "—"}
                      </span>
                      <Badge tone={stageTone(c.stage)}>{STAGE_LABEL[c.stage]}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </>
  );
}
