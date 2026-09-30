import { GlassCard } from "@/components/ui/glass-card";
import type { InterviewEvaluation } from "@/lib/api/interview";

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-[var(--color-text-muted)]">{label}</span>
        <span className="font-medium text-[var(--color-text)]">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
        <div className="h-full bg-[var(--color-accent)]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function InterviewAIAnalysis({
  evaluation,
  passed,
  passThreshold = 60,
}: {
  evaluation: InterviewEvaluation | null;
  passed?: boolean;
  passThreshold?: number;
}) {
  if (!evaluation) {
    return (
      <GlassCard className="!p-4">
        <p className="text-sm font-medium text-[var(--color-text)]">Interview evaluation</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Results will appear after you complete the interview.
        </p>
      </GlassCard>
    );
  }

  const didPass = passed ?? evaluation.overallScore >= passThreshold;

  return (
    <GlassCard className="space-y-3 !p-4">
      <div>
        <p className="text-sm font-medium text-[var(--color-text)]">Interview evaluation</p>
        <p className={`mt-2 text-2xl font-semibold ${didPass ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
          {evaluation.overallScore}/100
        </p>
        <p className={`mt-1 text-sm font-medium ${didPass ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
          {didPass ? `PASS — awaiting recruiter review (≥${passThreshold}%)` : `FAIL — cannot proceed (<${passThreshold}%)`}
        </p>
      </div>
      <Metric label="Technical" value={evaluation.technicalScore} />
      <Metric label="Communication" value={evaluation.communicationScore} />
      <Metric label="Problem solving" value={evaluation.problemSolvingScore} />
      <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{evaluation.feedback}</p>
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-3">
        <p className="text-xs font-medium text-[var(--color-text-muted)]">Recommendation</p>
        <p className="mt-1 text-sm text-[var(--color-text)]">{evaluation.recommendation}</p>
      </div>
    </GlassCard>
  );
}
