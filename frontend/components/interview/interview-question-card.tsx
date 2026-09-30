import { GlassCard } from "@/components/ui/glass-card";

interface InterviewQuestionCardProps {
  question: string;
  questionNumber: number;
  totalQuestions: number;
  /** Seconds remaining for this question (0–30). */
  secondsRemaining: number;
  jobTitle?: string;
}

export function InterviewQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  secondsRemaining,
  jobTitle,
}: InterviewQuestionCardProps) {
  const urgent = secondsRemaining <= 5;
  const clock = `00:${String(Math.max(0, secondsRemaining)).padStart(2, "0")}`;

  return (
    <GlassCard className="!p-4">
      {jobTitle ? (
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
          {jobTitle}
        </p>
      ) : null}
      <div className="mt-1 flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-[var(--color-text-muted)]">
          Interview Question {questionNumber} of {totalQuestions}
        </p>
        <p
          className={`font-mono text-sm font-semibold tabular-nums ${
            urgent ? "text-[var(--color-danger)]" : "text-[var(--color-text)]"
          }`}
          aria-live="polite"
        >
          {clock}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
        <div
          className={`h-full transition-all ${urgent ? "bg-[var(--color-danger)]" : "bg-[var(--color-accent)]"}`}
          style={{ width: `${(Math.max(0, secondsRemaining) / 30) * 100}%` }}
        />
      </div>
      <p className="mt-3 text-base leading-relaxed text-[var(--color-text)]">{question}</p>
    </GlassCard>
  );
}
