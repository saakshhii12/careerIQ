"use client";

import { use, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Info,
  BookOpen,
  Video,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  MessageSquare,
  Trophy,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PipelineProgress } from "@/components/status/pipeline-progress";
import { STAGE_LABEL, stageTone } from "@/components/status/stage-meta";
import { useApplication } from "@/lib/hooks/use-applications";
import {
  startQuiz,
  submitQuiz,
  type QuizQuestion,
  type QuizAnswer,
} from "@/lib/api/quiz";
import { createInterviewSession } from "@/lib/api/interview";

// ─── Quiz Modal ────────────────────────────────────────────────────────────────

interface QuizModalProps {
  applicationId: string;
  onClose: () => void;
  onPassed: () => void;
}

function QuizModal({ applicationId, onClose, onPassed }: QuizModalProps) {
  const [phase, setPhase] = useState<"loading" | "quiz" | "result">("loading");
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<{ score: number; passed: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load quiz on mount
  const loadQuiz = useCallback(async () => {
    setError(null);
    try {
      const data = await startQuiz(applicationId);
      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setPhase("quiz");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz.");
      setPhase("quiz");
    }
  }, [applicationId]);

  // Auto-load on mount
  useEffect(() => { loadQuiz(); }, [loadQuiz]);


  async function handleSubmit() {
    if (!attemptId) return;
    setSubmitting(true);
    setError(null);
    try {
      const answers: QuizAnswer[] = questions.map((q) => ({
        questionId: q.question_id,
        selectedOptionIndex: selected[q.question_id] ?? 0,
      }));
      const data = await submitQuiz(attemptId, answers);
      setResult({ score: data.score, passed: data.passed, message: data.message });
      setPhase("result");
      if (data.passed) onPassed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  const q = questions[current];
  const allAnswered = questions.length > 0 && questions.every((q) => selected[q.question_id] !== undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-2xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-[var(--color-accent)]" />
            <h2 className="text-base font-semibold text-[var(--color-text)]">Screening Quiz</h2>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors">✕</button>
        </div>

        <div className="p-6">
          {/* Loading */}
          {phase === "loading" && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 size={28} className="animate-spin text-[var(--color-accent)]" />
              <p className="text-sm text-[var(--color-text-muted)]">Loading quiz questions for this role…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
              <XCircle size={16} /> {error}
            </div>
          )}

          {/* Quiz */}
          {phase === "quiz" && q && (
            <div className="flex flex-col gap-5">
              {/* Progress */}
              <div className="flex items-center justify-between text-xs text-[var(--color-text-faint)]">
                <span>Question {current + 1} of {questions.length}</span>
                <span>{Object.keys(selected).length} answered</span>
              </div>
              <div className="h-1 w-full rounded-full bg-[var(--color-bg-elevated)]">
                <div
                  className="h-1 rounded-full bg-[var(--color-accent)] transition-all"
                  style={{ width: `${((current + 1) / questions.length) * 100}%` }}
                />
              </div>

              <p className="text-base font-medium leading-relaxed text-[var(--color-text)]">{q.question_text}</p>

              <div className="flex flex-col gap-2">
                {q.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelected((s) => ({ ...s, [q.question_id]: idx }))}
                    className={`text-left rounded-lg border px-4 py-3 text-sm transition-all ${
                      selected[q.question_id] === idx
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-text)]"
                        : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    <span className="mr-2 font-mono text-xs text-[var(--color-text-faint)]">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {opt}
                  </button>
                ))}
              </div>

              {/* Nav */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  disabled={current === 0}
                  className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30 transition-colors"
                >
                  ← Previous
                </button>
                {current < questions.length - 1 ? (
                  <Button onClick={() => setCurrent((c) => c + 1)} disabled={selected[q.question_id] === undefined}>
                    Next <ChevronRight size={14} />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={!allAnswered || submitting}>
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Submit Quiz
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Result */}
          {phase === "result" && result && (
            <div className="flex flex-col items-center gap-5 py-6 text-center">
              {result.passed ? (
                <Trophy size={48} className="text-[var(--color-warning)]" />
              ) : (
                <XCircle size={48} className="text-[var(--color-danger)]" />
              )}
              <div>
                <p className="text-3xl font-bold text-[var(--color-text)]">{result.score.toFixed(1)}%</p>
                <p className={`mt-1 text-sm font-medium ${result.passed ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                  {result.passed ? "Quiz passed" : "Quiz not passed"}
                </p>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">{result.message}</p>
              </div>
              {!result.passed && (
                <p className="text-xs text-[var(--color-text-faint)]">
                  Score was below 60%. This application cannot proceed.
                </p>
              )}
              <Button onClick={onClose} className="mt-2">Close</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ApplicationStatusDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: app, isLoading, isError, refetch } = useApplication(id);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [launchingInterview, setLaunchingInterview] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  async function handleLaunchInterview() {
    setLaunchingInterview(true);
    setLaunchError(null);
    try {
      const session = await createInterviewSession(id);
      router.push(`/student/interview/${session.sessionId}?applicationId=${id}`);
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : "Could not start interview.");
      setLaunchingInterview(false);
    }
  }

  function handleQuizPassed() {
    setQuizPassed(true);
    refetch();
  }

  const isRejected = app?.currentStage === "rejected";
  const interviewEligible = Boolean(app?.interviewEligible) || (quizPassed && !isRejected && app?.currentStage === "interview");
  const chatUnlocked = Boolean(app?.chatUnlocked) || app?.currentStage === "shortlisted" || app?.currentStage === "accepted";
  const canTakeQuiz =
    !isRejected &&
    !app?.quizPassed &&
    (app?.currentStage === "applied" || app?.currentStage === "assessment");

  return (
    <>
      <Topbar title={app ? app.jobTitle : "Application"} subtitle={app?.company} />

      {showQuiz && (
        <QuizModal
          applicationId={id}
          onClose={() => {
            setShowQuiz(false);
            refetch();
          }}
          onPassed={handleQuizPassed}
        />
      )}

      <div className="flex flex-col gap-6 p-8">
        <Link
          href="/student/status"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <ArrowLeft size={14} /> Back to all applications
        </Link>

        {isLoading && <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-bg-elevated)]" />}
        {isError && <div className="text-sm text-[var(--color-danger)]">Couldn&apos;t load this application.</div>}
        {!isLoading && !app && (
          <div className="text-sm text-[var(--color-text-muted)]">Application not found.</div>
        )}

        {app && (
          <>
            <GlassCard className="flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text)]">{app.jobTitle}</h2>
                  <p className="text-sm text-[var(--color-text-muted)]">{app.company}</p>
                </div>
                <Badge tone={stageTone(app.currentStage)}>{STAGE_LABEL[app.currentStage]}</Badge>
              </div>

              <PipelineProgress currentStage={app.currentStage} failedAt={app.failedAt} />

              <div className="flex flex-wrap gap-6 border-t border-[var(--color-border)] pt-5">
                <div>
                  <span className="text-xs text-[var(--color-text-faint)]">Match score</span>
                  <p className="font-mono text-lg text-[var(--color-text)]">{app.matchScore}%</p>
                </div>
                {app.assessmentScore !== undefined && (
                  <div>
                    <span className="text-xs text-[var(--color-text-faint)]">Quiz score</span>
                    <p className="font-mono text-lg text-[var(--color-text)]">{app.assessmentScore}%</p>
                  </div>
                )}
                {app.interviewScore !== undefined && (
                  <div>
                    <span className="text-xs text-[var(--color-text-faint)]">Interview score</span>
                    <p className="font-mono text-lg text-[var(--color-text)]">{app.interviewScore}%</p>
                  </div>
                )}
              </div>

              {app.decisionReason && (
                <div className="flex items-start gap-3 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] px-4 py-3.5">
                  <Info size={16} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
                  <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{app.decisionReason}</p>
                </div>
              )}

              {/* ── Action Area ─────────────────────────────────────────── */}
              <div className="border-t border-[var(--color-border)] pt-5">
                {isRejected && (
                  <div className="flex flex-col gap-2">
                    <p className="flex items-center gap-2 text-sm text-[var(--color-danger)]">
                      <XCircle size={16} /> This application cannot proceed.
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {app.failedAt === "interview"
                        ? "The AI interview score was below 60%."
                        : "The screening quiz score was below 60%."}
                    </p>
                  </div>
                )}

                {interviewEligible && !isRejected && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm text-[var(--color-success)]">
                      <CheckCircle2 size={16} />
                      Quiz passed — start the AI interview. You need 60% or higher to be shortlisted.
                    </div>
                    {launchError && (
                      <p className="text-sm text-[var(--color-danger)]">{launchError}</p>
                    )}
                    <Button
                      onClick={handleLaunchInterview}
                      disabled={launchingInterview}
                      className="w-fit"
                    >
                      {launchingInterview
                        ? <><Loader2 size={14} className="animate-spin" /> Starting interview…</>
                        : <><Video size={14} /> Start Interview</>
                      }
                    </Button>
                  </div>
                )}

                {canTakeQuiz && !interviewEligible && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Take the screening quiz to unlock the AI interview. A score below 60% closes this application.
                    </p>
                    <Button onClick={() => setShowQuiz(true)} className="w-fit">
                      <BookOpen size={14} /> Take Quiz
                    </Button>
                  </div>
                )}

                {chatUnlocked && !isRejected && (
                  <div className="flex flex-col gap-2">
                    <p className="flex items-center gap-2 text-sm text-[var(--color-success)]">
                      <CheckCircle2 size={16} />
                      Interview passed — you are shortlisted and recruiter chat is unlocked.
                    </p>
                    <Link href="/student/messages" className="w-fit">
                      <Button className="w-fit">
                        <MessageSquare size={14} /> Message the recruiter
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Timeline */}
            <GlassCard className="flex flex-col">
              <h3 className="mb-4 text-sm font-medium text-[var(--color-text)]">Timeline</h3>
              <div className="flex flex-col">
                {app.timeline.map((event, i) => (
                  <div key={i} className="flex gap-3 pb-5 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
                      {i < app.timeline.length - 1 && <div className="mt-1 h-full min-h-6 w-px bg-[var(--color-border)]" />}
                    </div>
                    <div>
                      <p className="text-sm text-[var(--color-text)]">{STAGE_LABEL[event.stage]}</p>
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
