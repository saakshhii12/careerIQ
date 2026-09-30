"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Check, X, ThumbsDown, MessageSquare, Star } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STAGE_LABEL, stageTone } from "@/components/status/stage-meta";
import { useCandidate, useDecideCandidate } from "@/lib/hooks/use-candidates";
import { downloadCandidateResume } from "@/lib/api/candidates";
import { useState } from "react";

function ScoreBlock({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-[var(--color-text-faint)]">{label}</span>
      {value !== undefined ? (
        <>
          <span className="font-mono text-2xl text-[var(--color-text)]">{value}%</span>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
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
  const [resumeError, setResumeError] = useState<string | null>(null);

  const decided = candidate && ["accepted", "rejected"].includes(candidate.stage);
  const canDecide = candidate && !["accepted", "rejected"].includes(candidate.stage);

  return (
    <>
      <Topbar title={candidate ? candidate.name : "Candidate"} subtitle={candidate?.jobTitle} />

      <div className="flex flex-col gap-6 p-8">
        <Link
          href="/recruiter/candidates"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <ArrowLeft size={14} /> Back to candidates
        </Link>

        {isLoading && <div className="h-80 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-bg-elevated)]" />}
        {isError && <div className="text-sm text-[var(--color-danger)]">Couldn&apos;t load this candidate.</div>}
        {!isLoading && !candidate && <div className="text-sm text-[var(--color-text-muted)]">Candidate not found.</div>}

        {candidate && (
          <>
            <GlassCard className="flex flex-col gap-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-base font-semibold text-[var(--color-accent)]">
                    {candidate.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">{candidate.name}</h2>
                    <p className="text-sm text-[var(--color-text-muted)]">Applied for {candidate.jobTitle}</p>
                    {candidate.education && (
                      <p className="mt-1 text-xs text-[var(--color-text-faint)]">{candidate.education}</p>
                    )}
                  </div>
                </div>
                <Badge tone={stageTone(candidate.stage)}>{candidate.currentStage || STAGE_LABEL[candidate.stage]}</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
                <FileText size={15} />
                {candidate.resumeFileName}
                {candidate.hasResume && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto"
                    onClick={async () => {
                      setResumeError(null);
                      try {
                        await downloadCandidateResume(candidate.id);
                      } catch (error) {
                        setResumeError(error instanceof Error ? error.message : "Unable to download resume.");
                      }
                    }}
                  >
                    Download resume
                  </Button>
                )}
              </div>
              {resumeError && <p className="text-xs text-[var(--color-danger)]">{resumeError}</p>}

              <div className="grid grid-cols-1 gap-6 border-t border-[var(--color-border)] pt-5 sm:grid-cols-3">
                <ScoreBlock label="Skill match" value={candidate.matchScore} />
                <ScoreBlock label="Quiz score" value={candidate.assessmentScore} />
                <ScoreBlock label="AI interview" value={candidate.interviewScore} />
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <GlassCard className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-[var(--color-text)]">Candidate information</h3>
                <p className="text-sm text-[var(--color-text-muted)]">{candidate.email || "Email not available"}</p>
                {candidate.phone && <p className="text-sm text-[var(--color-text-muted)]">{candidate.phone}</p>}
                {candidate.city && <p className="text-sm text-[var(--color-text-muted)]">{candidate.city}</p>}
                {candidate.skills && candidate.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {candidate.skills.map((skill) => (
                      <Badge key={skill} tone="neutral">{skill}</Badge>
                    ))}
                  </div>
                )}
              </GlassCard>

              <GlassCard className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-[var(--color-text)]">Job applied for</h3>
                <p className="text-sm font-medium text-[var(--color-text)]">{candidate.jobTitle}</p>
                {candidate.jobDescription && (
                  <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{candidate.jobDescription}</p>
                )}
              </GlassCard>
            </div>

            {(candidate.matchedSkills?.length || candidate.missingSkills?.length) && (
              <GlassCard className="flex flex-col gap-4">
                <h3 className="text-sm font-medium text-[var(--color-text)]">Skill match {candidate.matchScore}%</h3>
                {candidate.matchExplanation && (
                  <p className="text-sm text-[var(--color-text-muted)]">{candidate.matchExplanation}</p>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-[var(--color-success)]">Matched skills</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(candidate.matchedSkills ?? []).map((skill) => (
                        <Badge key={skill} tone="success">{skill}</Badge>
                      ))}
                      {(candidate.matchedSkills ?? []).length === 0 && (
                        <p className="text-sm text-[var(--color-text-faint)]">None recorded</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--color-warning)]">Missing skills</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(candidate.missingSkills ?? []).map((skill) => (
                        <Badge key={skill} tone="warning">{skill}</Badge>
                      ))}
                      {(candidate.missingSkills ?? []).length === 0 && (
                        <p className="text-sm text-[var(--color-text-faint)]">None recorded</p>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}

            {candidate.experience && candidate.experience.length > 0 && (
              <GlassCard className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-[var(--color-text)]">Experience</h3>
                {candidate.experience.map((item, index) => (
                  <p key={`${item.company}-${index}`} className="text-sm text-[var(--color-text-muted)]">
                    {[item.designation, item.company, item.duration].filter(Boolean).join(" · ")}
                  </p>
                ))}
              </GlassCard>
            )}

            <GlassCard className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-[var(--color-text)]">Quiz result</h3>
              {candidate.quizStatus === "Not Started" || !candidate.quizStatus ? (
                <p className="text-sm text-[var(--color-text-muted)]">Assessment not completed.</p>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Status: {candidate.quizStatus}
                  {candidate.assessmentScore != null ? ` · Score: ${candidate.assessmentScore}%` : ""}
                  {candidate.quizStatus === "Completed"
                    ? candidate.quizPassed
                      ? " · Passed"
                      : " · Failed"
                    : ""}
                </p>
              )}
            </GlassCard>

            {candidate.resumeAnalysis && (
              <GlassCard className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-[var(--color-text)]">Resume analysis</h3>
                {candidate.resumeAnalysis.atsScore != null && (
                  <p className="text-sm text-[var(--color-text-muted)]">ATS score: {candidate.resumeAnalysis.atsScore}%</p>
                )}
                {candidate.resumeAnalysis.strengths && (
                  <p className="text-sm text-[var(--color-text-muted)]">{candidate.resumeAnalysis.strengths}</p>
                )}
                {candidate.resumeAnalysis.weaknesses && (
                  <p className="text-sm text-[var(--color-text-muted)]">{candidate.resumeAnalysis.weaknesses}</p>
                )}
              </GlassCard>
            )}

            {candidate.resumeText && (
              <GlassCard className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-[var(--color-text)]">Resume text</h3>
                <p className="max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {candidate.resumeText}
                </p>
              </GlassCard>
            )}

            {candidate.interviewStatus !== "Completed" && candidate.interviewScore === undefined && (
              <GlassCard className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-[var(--color-text)]">AI interview</h3>
                <p className="text-sm text-[var(--color-text-muted)]">Interview not completed.</p>
              </GlassCard>
            )}

            {candidate.integrityEvents && candidate.integrityEvents.length > 0 && (
              <GlassCard className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-[var(--color-text)]">Interview integrity</h3>
                {candidate.integrityViolationCount != null && (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Recorded events: {candidate.integrityEvents.length}
                    {candidate.integrityViolationCount > 0
                      ? ` · Violation counter: ${candidate.integrityViolationCount}`
                      : ""}
                  </p>
                )}
                <ul className="max-h-48 space-y-2 overflow-y-auto text-sm text-[var(--color-text-muted)]">
                  {candidate.integrityEvents.slice(0, 12).map((event, idx) => (
                    <li key={`${event.type}-${idx}`}>
                      {event.type} ({event.severity}) ·{" "}
                      {new Date(event.at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}

            {candidate.interviewScore !== undefined && (
              <GlassCard className="flex flex-col gap-5">
                <h3 className="text-sm font-medium text-[var(--color-text)]">AI interview evaluation</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <ScoreBlock label="Technical" value={candidate.technicalScore} />
                  <ScoreBlock label="Communication" value={candidate.communicationScore} />
                  <ScoreBlock label="Problem solving" value={candidate.problemSolvingScore} />
                  <ScoreBlock label="Confidence" value={candidate.confidenceScore} />
                </div>
                {candidate.recommendation && (
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
                      Final recommendation
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-text)]">{candidate.recommendation}</p>
                  </div>
                )}
                {candidate.interviewSummary && (
                  <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{candidate.interviewSummary}</p>
                )}
              </GlassCard>
            )}

            {(candidate.strengths || candidate.weaknesses) && (
              <GlassCard className="flex flex-col gap-5">
                <h3 className="text-sm font-medium text-[var(--color-text)]">Interview report</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {candidate.strengths && (
                    <div>
                      <span className="text-xs font-medium text-[var(--color-success)]">Strengths</span>
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {candidate.strengths.map((s) => (
                          <li key={s} className="text-sm text-[var(--color-text-muted)]">· {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {candidate.weaknesses && (
                    <div>
                      <span className="text-xs font-medium text-[var(--color-warning)]">Areas of concern</span>
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {candidate.weaknesses.map((w) => (
                          <li key={w} className="text-sm text-[var(--color-text-muted)]">· {w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {candidate.interviewTranscript && candidate.interviewTranscript.length > 0 && (
              <GlassCard className="flex flex-col gap-4">
                <h3 className="text-sm font-medium text-[var(--color-text)]">Interview transcript</h3>
                <div className="flex flex-col gap-4">
                  {candidate.interviewTranscript.map((item, index) => (
                    <div
                      key={`${index}-${item.question.slice(0, 24)}`}
                      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-4 py-3"
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-accent)]">
                        Question {index + 1}
                      </p>
                      <p className="mt-2 text-sm text-[var(--color-text)]">{item.question}</p>
                      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
                        Answer
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            <GlassCard className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-medium text-[var(--color-text)]">Recruiter decision</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {candidate.stage === "rejected"
                    ? "This application was rejected. History is retained."
                    : candidate.chatUnlocked
                      ? "This candidate is shortlisted. Recruiter chat is unlocked."
                      : "Shortlist only after reviewing resume, match, quiz, and AI interview. Chat unlocks after shortlist."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  disabled={decideMutation.isPending || !canDecide || candidate.stage === "shortlisted"}
                  onClick={() => decideMutation.mutate({ id: candidate.id, decision: "shortlist" })}
                >
                  <Star size={15} /> Shortlist
                </Button>
                <Button
                  variant="danger"
                  disabled={decideMutation.isPending || candidate.stage === "rejected"}
                  onClick={() => decideMutation.mutate({ id: candidate.id, decision: "reject" })}
                >
                  <ThumbsDown size={15} /> Reject
                </Button>
              </div>
              {candidate.chatUnlocked && (
                <Link href="/recruiter/messages" className="w-fit">
                  <Button variant="secondary" className="w-fit">
                    <MessageSquare size={15} /> Open recruiter chat
                  </Button>
                </Link>
              )}
              {decided && (
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-faint)]">
                  {candidate.stage === "accepted" && <Check size={13} className="text-[var(--color-success)]" />}
                  {candidate.stage === "rejected" && <X size={13} className="text-[var(--color-danger)]" />}
                  Recruiter chat {candidate.chatUnlocked ? "is unlocked." : "stays locked."}
                </div>
              )}
            </GlassCard>
          </>
        )}
      </div>
    </>
  );
}
