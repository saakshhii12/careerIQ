import { User } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="max-w-[60%] truncate text-right font-medium text-[var(--color-text)]">{value}</span>
    </div>
  );
}

interface InterviewSidebarProps {
  candidateInfo: Record<string, unknown> | null;
  jobTitle?: string;
  companyName?: string;
  cameraStatus: string;
  micStatus: string;
  interviewTime: string;
  questionSecondsRemaining: number;
  sessionStatus: string;
  completedAnswers: number;
  totalQuestions: number;
  tabLifelinesUsed?: number;
  tabLifelinesTotal?: number;
}

export function InterviewSidebar(props: InterviewSidebarProps) {
  return (
    <div className="space-y-3">
      <GlassCard className="space-y-3 !p-4">
        <div className="flex items-center gap-2">
          <User size={16} className="text-[var(--color-text-muted)]" />
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">Candidate</p>
            <p className="text-sm font-medium text-[var(--color-text)]">
              {(props.candidateInfo?.candidateName as string) || "Not available"}
            </p>
          </div>
        </div>
        <Row label="Job" value={props.jobTitle || "Not available"} />
        {props.companyName ? <Row label="Company" value={props.companyName} /> : null}
      </GlassCard>

      <GlassCard className="space-y-2.5 !p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          Session
        </p>
        <Row label="Elapsed" value={props.interviewTime} />
        <Row
          label="Question timer"
          value={`00:${String(Math.max(0, props.questionSecondsRemaining)).padStart(2, "0")}`}
        />
        <Row label="Camera" value={props.cameraStatus} />
        <Row label="Microphone" value={props.micStatus} />
        <Row
          label="Tab lifelines"
          value={`${props.tabLifelinesUsed ?? 0}/${props.tabLifelinesTotal ?? 3}`}
        />
        <Row label="Answers" value={`${props.completedAnswers}/${props.totalQuestions}`} />
        <Row label="Status" value={props.sessionStatus} />
      </GlassCard>
    </div>
  );
}
