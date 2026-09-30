"use client";

import { InterviewSidebar } from "./interview-sidebar";
import { InterviewQuestionCard } from "./interview-question-card";
import { InterviewAnswerBox } from "./interview-answer-box";
import { InterviewWebcamCard } from "./interview-webcam-card";
import { InterviewAIAnalysis } from "./interview-ai-analysis";
import type { InterviewEvaluation } from "@/lib/api/interview";
import { Button } from "@/components/ui/button";
import Webcam from "react-webcam";

interface WarningState {
  type: string;
  reason: string;
  windowSwitchCount?: number;
  soft?: boolean;
  lifelinesUsed?: number;
  lifelinesTotal?: number;
}

interface InterviewLayoutProps {
  question: string;
  questionNumber: number;
  totalQuestions: number;
  questionSecondsRemaining: number;
  jobTitle?: string;
  companyName?: string;
  onSubmitAnswer: (answer: string) => void;
  finalEvaluation: InterviewEvaluation | null;
  pipelinePassed?: boolean;
  passThreshold?: number;
  loading: boolean;
  candidateInfo: Record<string, unknown> | null;
  completedAnswers: number;
  interviewTime: string;
  cameraStatus: string;
  integrityMonitorStatus?: string;
  tabLifelinesUsed?: number;
  tabLifelinesTotal?: number;
  onCameraStatusChange: (status: string, reason?: { type: string; message: string }) => void;
  micStatus: string;
  onMicStatusChange: (status: string) => void;
  sessionStatus: string;
  paused: boolean;
  warning: WarningState | null;
  onResume: () => void;
  onDismissWarning?: () => void;
  onRetryFinalEvaluation: () => void;
  webcamRef: React.RefObject<Webcam | null>;
  forceSubmitToken: number;
  onPermissionActivity: () => void;
}

function statusLabel(sessionStatus: string, paused: boolean) {
  if (sessionStatus === "TERMINATED") return "Interview terminated";
  if (paused) return "Interview paused";
  if (sessionStatus === "COMPLETED") return "Interview completed";
  if (sessionStatus === "EVALUATING") return "Preparing evaluation";
  if (sessionStatus === "ERROR") return "Interview ended";
  return "Interview in progress";
}

function WarningOverlay({
  warning,
  onResume,
  onRetry,
  onDismiss,
  canResume,
}: {
  warning: WarningState | null;
  onResume: () => void;
  onRetry: () => void;
  onDismiss?: () => void;
  canResume: boolean;
}) {
  if (!warning) return null;

  if (warning.soft) {
    return (
      <div className="fixed bottom-20 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-surface)] p-4 shadow-md">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">Interview Warning</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{warning.reason}</p>
        <div className="mt-3">
          <Button size="sm" variant="secondary" onClick={onDismiss}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  const title =
    warning.type === "INTERVIEW_TERMINATED"
      ? "Interview ended"
      : warning.type === "EVALUATION_ERROR"
        ? "Evaluation unavailable"
        : warning.type === "TAB_SWITCH"
          ? "Interview Warning"
          : "Interview Paused";

  const lifelinesUsed = warning.lifelinesUsed ?? warning.windowSwitchCount;
  const lifelinesTotal = warning.lifelinesTotal ?? 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-md">
        <h2 className="text-base font-semibold text-[var(--color-text)]">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">{warning.reason}</p>
        {lifelinesUsed ? (
          <p className="mt-3 rounded-md border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-3 py-2 text-sm font-medium text-[var(--color-warning)]">
            Lifelines used: {lifelinesUsed} of {lifelinesTotal}
          </p>
        ) : null}
        <div className="mt-5 flex gap-2">
          {warning.type === "EVALUATION_ERROR" ? (
            <Button onClick={onRetry}>Retry evaluation</Button>
          ) : warning.type !== "INTERVIEW_TERMINATED" ? (
            <Button onClick={onResume} disabled={!canResume}>
              Resume interview
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function InterviewLayout(props: InterviewLayoutProps) {
  const progress = Math.round((props.completedAnswers / props.totalQuestions) * 100);
  const inProgress = props.sessionStatus === "RUNNING" && !props.paused;
  const showQuestionUi =
    props.sessionStatus === "RUNNING" || props.sessionStatus === "PAUSED";

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-3 lg:px-6">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold">AI Interview</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {props.jobTitle || "Structured assessment session"}
              {props.companyName ? ` · ${props.companyName}` : ""}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-sm">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${inProgress ? "bg-[var(--color-success)]" : "bg-[var(--color-text-faint)]"}`}
              />
              <span className="text-[var(--color-text-muted)]">
                {statusLabel(props.sessionStatus, props.paused)}
              </span>
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">
              Tab lifelines: {props.tabLifelinesUsed ?? 0}/{props.tabLifelinesTotal ?? 3}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 p-4 lg:grid-cols-[220px_minmax(0,1fr)_300px] lg:p-6">
        <InterviewSidebar
          candidateInfo={props.candidateInfo}
          jobTitle={props.jobTitle}
          companyName={props.companyName}
          cameraStatus={props.cameraStatus}
          micStatus={props.micStatus}
          interviewTime={props.interviewTime}
          questionSecondsRemaining={props.questionSecondsRemaining}
          sessionStatus={props.sessionStatus}
          completedAnswers={props.completedAnswers}
          totalQuestions={props.totalQuestions}
          tabLifelinesUsed={props.tabLifelinesUsed}
          tabLifelinesTotal={props.tabLifelinesTotal}
        />

        <div className="flex min-h-0 flex-col gap-4">
          {showQuestionUi ? (
            <>
              <InterviewQuestionCard
                question={props.question}
                questionNumber={props.questionNumber}
                totalQuestions={props.totalQuestions}
                secondsRemaining={props.questionSecondsRemaining}
                jobTitle={props.jobTitle}
              />
              <InterviewAnswerBox
                key={props.questionNumber}
                questionKey={props.questionNumber}
                forceSubmitToken={props.forceSubmitToken}
                onSubmitAnswer={props.onSubmitAnswer}
                loading={props.loading}
                paused={props.paused}
                disabled={props.sessionStatus !== "RUNNING"}
                onMicStatusChange={props.onMicStatusChange}
                onPermissionActivity={props.onPermissionActivity}
              />
            </>
          ) : (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-muted)]">
              {props.sessionStatus === "EVALUATING"
                ? "Preparing your evaluation…"
                : props.sessionStatus === "COMPLETED"
                  ? "Interview complete. Review your evaluation on the right."
                  : props.sessionStatus === "TERMINATED"
                    ? "Interview terminated due to integrity violations."
                    : "Interview session ended."}
            </div>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <InterviewWebcamCard
            webcamRef={props.webcamRef}
            cameraStatus={props.cameraStatus}
            integrityMonitorStatus={props.integrityMonitorStatus}
            onStatusChange={props.onCameraStatusChange}
            onPermissionActivity={props.onPermissionActivity}
          />
          <InterviewAIAnalysis
            evaluation={props.finalEvaluation}
            passed={props.pipelinePassed}
            passThreshold={props.passThreshold}
          />
        </div>
      </main>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-3 lg:px-6">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 text-sm">
          <span className="text-[var(--color-text-muted)]">Progress</span>
          <span className="text-[var(--color-text)]">
            {props.completedAnswers}/{props.totalQuestions} · {progress}%
          </span>
        </div>
        <div className="mx-auto mt-2 h-1.5 max-w-[1400px] overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
          <div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <WarningOverlay
        warning={props.warning}
        onResume={props.onResume}
        onRetry={props.onRetryFinalEvaluation}
        onDismiss={props.onDismissWarning}
        canResume={props.cameraStatus === "Connected" || props.warning?.type === "TAB_SWITCH"}
      />
    </div>
  );
}
