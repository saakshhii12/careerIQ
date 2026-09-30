"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import {
  completeInterviewSession,
  fetchInterviewSession,
  reportIdentityMonitor,
  reportIntegrityEvent,
  type InterviewCompleteResult,
  type InterviewEvaluation,
  type InterviewSessionQuestion,
} from "@/lib/api/interview";
import { createIntegrityMonitor } from "@/lib/interview/integrity-monitor";
import { sampleFaceFromVideo } from "@/lib/interview/face-identity";
import { createTabVisibilityDetector } from "@/lib/interview/tab-visibility";
import { createViolationManager } from "@/lib/interview/violation-manager";
import { InterviewLayout } from "@/components/interview/interview-layout";
import { IdentityVerificationGate } from "@/components/interview/identity-verification-gate";

const QUESTION_SECONDS = 30;

const formatTime = (totalSeconds: number) =>
  `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;

interface InterviewSessionProps {
  sessionId: string;
  applicationId?: string;
}

interface ProgressSnapshot {
  index: number;
  responses: { question: string; answer: string }[];
  questionDeadlineAt: number;
  elapsedSeconds: number;
}

function progressKey(sessionId: string) {
  return `careeriq_interview_progress_${sessionId}`;
}

function loadProgress(sessionId: string): ProgressSnapshot | null {
  try {
    const raw = sessionStorage.getItem(progressKey(sessionId));
    if (!raw) return null;
    return JSON.parse(raw) as ProgressSnapshot;
  } catch {
    return null;
  }
}

function saveProgress(sessionId: string, snapshot: ProgressSnapshot) {
  try {
    sessionStorage.setItem(progressKey(sessionId), JSON.stringify(snapshot));
  } catch {
    // sessionStorage may be unavailable — ignore.
  }
}

function clearProgress(sessionId: string) {
  try {
    sessionStorage.removeItem(progressKey(sessionId));
  } catch {
    // ignore
  }
}

export function InterviewSession({ sessionId, applicationId }: InterviewSessionProps) {
  const router = useRouter();
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [allQuestions, setAllQuestions] = useState<InterviewSessionQuestion[]>([]);
  const [resumeText, setResumeText] = useState("");
  const [candidateInfo, setCandidateInfo] = useState<Record<string, unknown> | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [numericSessionId, setNumericSessionId] = useState<number | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<{ question: string; answer: string }[]>([]);
  const responsesRef = useRef<{ question: string; answer: string }[]>([]);
  const [finalEvaluation, setFinalEvaluation] = useState<InterviewEvaluation | null>(null);
  const [pipelineResult, setPipelineResult] = useState<InterviewCompleteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState("VERIFYING");
  const sessionStatusRef = useRef("VERIFYING");
  const [identityVerified, setIdentityVerified] = useState(false);
  const [hasEnrolledIdentity, setHasEnrolledIdentity] = useState(false);
  const identityPauseRemainingRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cameraStatus, setCameraStatus] = useState("Connecting");
  const [micStatus, setMicStatus] = useState("OFF");
  const [warning, setWarning] = useState<{
    type: string;
    reason: string;
    windowSwitchCount?: number;
    soft?: boolean;
    lifelinesUsed?: number;
    lifelinesTotal?: number;
  } | null>(null);
  const [integrityMonitorStatus, setIntegrityMonitorStatus] = useState("Waiting for camera");
  const [tabLifelinesUsed, setTabLifelinesUsed] = useState(0);
  const [integrityEvents, setIntegrityEvents] = useState<
    { type: string; reason: string; details?: Record<string, unknown>; at: string }[]
  >([]);
  const [questionDeadlineAt, setQuestionDeadlineAt] = useState(() => Date.now() + QUESTION_SECONDS * 1000);
  const [questionSecondsRemaining, setQuestionSecondsRemaining] = useState(QUESTION_SECONDS);
  const [forceSubmitToken, setForceSubmitToken] = useState(0);

  const webcamRef = useRef<Webcam | null>(null);
  const tabDetectorRef = useRef<ReturnType<typeof createTabVisibilityDetector> | null>(null);
  const violationManagerRef = useRef(createViolationManager());
  const tabSwitchCountRef = useRef(0);
  const advancingRef = useRef(false);
  const questionDeadlineRef = useRef(questionDeadlineAt);
  const currentIndexRef = useRef(0);
  const timeoutFiredForDeadlineRef = useRef<number | null>(null);
  const questionStartedAtRef = useRef<number>(Date.now());
  const questionTimingsRef = useRef<
    {
      questionId: number;
      startedAt: string;
      submittedAt: string;
      elapsedMs: number;
      timedOut: boolean;
      answerLength: number;
    }[]
  >([]);

  useEffect(() => {
    sessionStatusRef.current = sessionStatus;
  }, [sessionStatus]);

  useEffect(() => {
    questionDeadlineRef.current = questionDeadlineAt;
  }, [questionDeadlineAt]);

  useEffect(() => {
    currentIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchInterviewSession(sessionId);
        if (cancelled) return;
        setAllQuestions(data.questions);
        setResumeText(data.resumeText);
        setCandidateInfo(data.candidateInfo);
        setJobTitle(data.job.jobTitle || "");
        setCompanyName(data.job.companyName || "");
        setNumericSessionId(data.sessionId);
        setHasEnrolledIdentity(Boolean(data.hasEnrolledIdentity));
        const verified = Boolean(data.identityVerified);
        setIdentityVerified(verified);
        setSessionStatus(verified ? "RUNNING" : "VERIFYING");
        sessionStatusRef.current = verified ? "RUNNING" : "VERIFYING";

        const saved = loadProgress(sessionId);
        if (saved && saved.index >= 0 && saved.index < data.questions.length) {
          setCurrentQuestionIndex(saved.index);
          currentIndexRef.current = saved.index;
          responsesRef.current = saved.responses || [];
          setResponses(saved.responses || []);
          setElapsedSeconds(saved.elapsedSeconds || 0);
          const deadline =
            saved.questionDeadlineAt && saved.questionDeadlineAt > Date.now()
              ? saved.questionDeadlineAt
              : Date.now() + QUESTION_SECONDS * 1000;
          setQuestionDeadlineAt(deadline);
          questionDeadlineRef.current = deadline;
          questionStartedAtRef.current = Date.now() - (QUESTION_SECONDS * 1000 - Math.max(0, deadline - Date.now()));
        } else {
          const deadline = Date.now() + QUESTION_SECONDS * 1000;
          setQuestionDeadlineAt(deadline);
          questionDeadlineRef.current = deadline;
          questionStartedAtRef.current = Date.now();
        }

        setLoadingSession(false);
      } catch (err) {
        if (!cancelled) {
          setSessionError(err instanceof Error ? err.message : "Failed to load interview.");
          setLoadingSession(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const persistProgress = useCallback(
    (index: number, nextResponses: { question: string; answer: string }[], deadline: number, elapsed: number) => {
      saveProgress(sessionId, {
        index,
        responses: nextResponses,
        questionDeadlineAt: deadline,
        elapsedSeconds: elapsed,
      });
    },
    [sessionId]
  );

  const notifyPermissionActivity = useCallback(() => {
    tabDetectorRef.current?.notifyPermissionActivity();
  }, []);

  const recordEvent = useCallback(
    (type: string, reason: string, details: Record<string, unknown> = {}, severity = "warning") => {
      setIntegrityEvents((events) => [
        ...events,
        { type, reason, details, at: new Date().toISOString() },
      ]);
      if (numericSessionId) {
        reportIntegrityEvent(numericSessionId, type, severity, { reason, ...details }).catch(() => {});
      }
    },
    [numericSessionId]
  );

  const handleConfirmedViolation = useCallback(
    (type: string, reason: string, details: Record<string, unknown> = {}) => {
      if (
        sessionStatusRef.current === "COMPLETED" ||
        sessionStatusRef.current === "EVALUATING" ||
        sessionStatusRef.current === "ERROR" ||
        sessionStatusRef.current === "TERMINATED"
      ) {
        return;
      }

      const decision = violationManagerRef.current.handleConfirmed(type, reason);
      if (type === "TAB_SWITCH") {
        tabSwitchCountRef.current = decision.lifelinesUsed || decision.warningCount;
        setTabLifelinesUsed(tabSwitchCountRef.current);
      }

      recordEvent(
        type,
        reason,
        {
          ...details,
          warningCount: decision.warningCount,
          lifelinesUsed: decision.lifelinesUsed,
          lifelinesTotal: decision.lifelinesTotal,
        },
        "critical"
      );

      if (decision.shouldTerminate) {
        window.speechSynthesis?.cancel();
        setMicStatus("OFF");
        setWarning({
          type: "INTERVIEW_TERMINATED",
          reason: decision.message,
          windowSwitchCount: decision.lifelinesUsed,
          lifelinesUsed: decision.lifelinesUsed,
          lifelinesTotal: decision.lifelinesTotal,
        });
        setSessionStatus("TERMINATED");
        return;
      }

      // Tab lifeline warnings always pause with a clear modal (not a tiny soft toast).
      if (type === "TAB_SWITCH" && decision.shouldPause) {
        window.speechSynthesis?.cancel();
        setMicStatus("OFF");
        setWarning({
          type: "TAB_SWITCH",
          reason: decision.message,
          windowSwitchCount: decision.lifelinesUsed,
          lifelinesUsed: decision.lifelinesUsed,
          lifelinesTotal: decision.lifelinesTotal,
        });
        setSessionStatus("PAUSED");
        return;
      }

      if (decision.shouldWarn && !decision.shouldPause) {
        setWarning({
          type: "INTERVIEW_WARNING",
          reason: decision.message,
          soft: true,
          windowSwitchCount: tabSwitchCountRef.current || undefined,
          lifelinesUsed: decision.lifelinesUsed,
          lifelinesTotal: decision.lifelinesTotal,
        });
        return;
      }

      if (decision.shouldPause && sessionStatusRef.current === "RUNNING") {
        window.speechSynthesis?.cancel();
        setMicStatus("OFF");
        if (type === "IDENTITY_MISMATCH" || type === "IDENTITY_FAILED") {
          identityPauseRemainingRef.current = Math.max(
            0,
            questionDeadlineRef.current - Date.now()
          );
        }
        setWarning({
          type,
          reason: decision.message,
          windowSwitchCount: tabSwitchCountRef.current || undefined,
        });
        setSessionStatus("PAUSED");
      }
    },
    [recordEvent]
  );

  // Tab/visibility detector — ignores permission dialogs & short flickers.
  useEffect(() => {
    const detector = createTabVisibilityDetector((event) => {
      if (event.level === "transient") return;
      handleConfirmedViolation(event.type, event.reason, { hiddenMs: event.hiddenMs });
    });
    tabDetectorRef.current = detector;
    return () => {
      detector.dispose();
      tabDetectorRef.current = null;
    };
  }, [handleConfirmedViolation]);

  // Camera vision monitor — only after identity verification succeeds.
  useEffect(() => {
    if (!identityVerified || sessionStatus !== "RUNNING" || cameraStatus !== "Connected") {
      return undefined;
    }

    let cancelled = false;
    let dispose: (() => void) | undefined;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;

    const start = async () => {
      const video = webcamRef.current?.video;
      if (!video || video.readyState < 2 || video.videoWidth === 0) {
        setIntegrityMonitorStatus("Waiting for camera frames…");
        pollTimer = setTimeout(() => {
          if (!cancelled) void start();
        }, 250);
        return;
      }

      setIntegrityMonitorStatus("Starting security monitor…");
      try {
        const handle = await createIntegrityMonitor(
          video,
          ({ type, reason, details }) => handleConfirmedViolation(type, reason, details ?? {}),
          undefined,
          (status, detail) => {
            if (!cancelled) setIntegrityMonitorStatus(detail || status);
          }
        );
        if (cancelled) {
          handle.dispose();
          return;
        }
        dispose = () => handle.dispose();
        setIntegrityMonitorStatus("Camera integrity: active");
      } catch (error) {
        console.warn("Integrity monitoring unavailable:", (error as Error).message);
        if (!cancelled) setIntegrityMonitorStatus("Camera integrity: unavailable");
      }
    };

    void start();
    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
      dispose?.();
    };
  }, [cameraStatus, handleConfirmedViolation, identityVerified, sessionStatus]);

  // Continuous identity match against the enrolled baseline (server-side decision).
  useEffect(() => {
    if (!identityVerified || !numericSessionId || sessionStatus !== "RUNNING") return undefined;
    if (cameraStatus !== "Connected") return undefined;

    let cancelled = false;
    const interval = window.setInterval(() => {
      void (async () => {
        const video = webcamRef.current?.video;
        if (!video || cancelled) return;
        try {
          const sample = await sampleFaceFromVideo(video);
          if (!sample.descriptor || sample.faceCount !== 1) return;
          const result = await reportIdentityMonitor(numericSessionId, sample.descriptor);
          if (cancelled) return;
          if (!result.matched) {
            handleConfirmedViolation(
              "IDENTITY_MISMATCH",
              result.reason || "Possible identity mismatch. Please re-verify to continue."
            );
          }
        } catch (error) {
          console.warn("Identity monitor sample failed:", (error as Error).message);
        }
      })();
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [cameraStatus, handleConfirmedViolation, identityVerified, numericSessionId, sessionStatus]);

  // Session elapsed timer (pauses while not RUNNING).
  useEffect(() => {
    if (sessionStatus !== "RUNNING") return undefined;
    const interval = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [sessionStatus]);

  // Wall-clock per-question countdown. Identity pauses freeze remaining time.
  useEffect(() => {
    if (loadingSession || allQuestions.length === 0 || !identityVerified) return undefined;
    if (
      sessionStatus === "COMPLETED" ||
      sessionStatus === "EVALUATING" ||
      sessionStatus === "ERROR" ||
      sessionStatus === "TERMINATED" ||
      sessionStatus === "VERIFYING"
    ) {
      return undefined;
    }
    if (sessionStatus === "PAUSED" && identityPauseRemainingRef.current != null) {
      return undefined;
    }

    const tick = () => {
      const deadline = questionDeadlineRef.current;
      const remainingMs = deadline - Date.now();
      const secs = Math.max(0, Math.ceil(remainingMs / 1000));
      setQuestionSecondsRemaining(secs);
      if (
        secs <= 0 &&
        !advancingRef.current &&
        timeoutFiredForDeadlineRef.current !== deadline
      ) {
        timeoutFiredForDeadlineRef.current = deadline;
        setForceSubmitToken((token) => token + 1);
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [allQuestions.length, identityVerified, loadingSession, sessionStatus, currentQuestionIndex]);

  // Persist progress when state changes.
  useEffect(() => {
    if (loadingSession || allQuestions.length === 0) return;
    persistProgress(currentQuestionIndex, responsesRef.current, questionDeadlineAt, elapsedSeconds);
  }, [
    currentQuestionIndex,
    elapsedSeconds,
    loadingSession,
    allQuestions.length,
    persistProgress,
    questionDeadlineAt,
    responses,
  ]);

  const finishInterview = async (
    nextResponses: { question: string; answer: string }[],
    duration: number,
    events: typeof integrityEvents
  ) => {
    if (!numericSessionId) throw new Error("Interview session is not ready.");
    const dbAnswers = nextResponses.map((r, idx) => ({
      questionId: allQuestions[idx].questionId,
      answer: r.answer,
    }));
    return completeInterviewSession(numericSessionId, dbAnswers, {
      durationSeconds: duration,
      integrityEvents: events,
      questionTimings: questionTimingsRef.current,
    });
  };

  const handleAnswerSubmit = async (answer: string) => {
    if (advancingRef.current) return;
    if (sessionStatusRef.current !== "RUNNING" && sessionStatusRef.current !== "PAUSED") return;
    // Timeout may fire while paused — still accept the forced submit.
    advancingRef.current = true;
    window.speechSynthesis?.cancel();

    const index = currentIndexRef.current;
    const question = allQuestions[index];
    if (!question) {
      advancingRef.current = false;
      return;
    }

    const submittedAt = Date.now();
    const startedAt = questionStartedAtRef.current || submittedAt;
    const elapsedMs = Math.max(0, submittedAt - startedAt);
    const timedOut = elapsedMs >= QUESTION_SECONDS * 1000 - 250;
    questionTimingsRef.current = [
      ...questionTimingsRef.current,
      {
        questionId: question.questionId,
        startedAt: new Date(startedAt).toISOString(),
        submittedAt: new Date(submittedAt).toISOString(),
        elapsedMs,
        timedOut,
        answerLength: answer.trim().length,
      },
    ];
    if (numericSessionId) {
      reportIntegrityEvent(numericSessionId, "QUESTION_TIMING", "info", {
        questionId: question.questionId,
        startedAt: new Date(startedAt).toISOString(),
        submittedAt: new Date(submittedAt).toISOString(),
        elapsedMs,
        timedOut,
        answerLength: answer.trim().length,
      }).catch(() => {});
    }

    const response = { question: question.question, answer };
    const nextResponses = [...responsesRef.current, response];
    responsesRef.current = nextResponses;
    setResponses(nextResponses);
    setLoading(true);

    if (index < allQuestions.length - 1) {
      const nextIndex = index + 1;
      const deadline = Date.now() + QUESTION_SECONDS * 1000;
      timeoutFiredForDeadlineRef.current = null;
      questionStartedAtRef.current = Date.now();
      setCurrentQuestionIndex(nextIndex);
      currentIndexRef.current = nextIndex;
      setQuestionDeadlineAt(deadline);
      questionDeadlineRef.current = deadline;
      setQuestionSecondsRemaining(QUESTION_SECONDS);
      persistProgress(nextIndex, nextResponses, deadline, elapsedSeconds);
      // If we were paused only for soft reasons, stay; timeout submits don't auto-resume.
      if (sessionStatusRef.current === "PAUSED") {
        // Keep paused — user must resume. Next question is ready when they do.
      } else {
        setSessionStatus("RUNNING");
      }
      setLoading(false);
      advancingRef.current = false;
      return;
    }

    setSessionStatus("EVALUATING");
    try {
      const result = await finishInterview(nextResponses, elapsedSeconds, integrityEvents);
      clearProgress(sessionId);
      setFinalEvaluation(result.evaluation);
      setPipelineResult(result);
      setSessionStatus("COMPLETED");
    } catch (error) {
      console.error("Final interview evaluation failed:", error);
      setSessionStatus("ERROR");
      setWarning({
        type: "EVALUATION_ERROR",
        reason:
          error instanceof Error
            ? error.message
            : "Could not generate the final evaluation. Please retry.",
      });
    } finally {
      setLoading(false);
      advancingRef.current = false;
    }
  };

  const retryFinalEvaluation = async () => {
    setWarning(null);
    setLoading(true);
    setSessionStatus("EVALUATING");
    try {
      const result = await finishInterview(responsesRef.current, elapsedSeconds, integrityEvents);
      clearProgress(sessionId);
      setFinalEvaluation(result.evaluation);
      setPipelineResult(result);
      setSessionStatus("COMPLETED");
    } catch (error) {
      setSessionStatus("ERROR");
      setWarning({
        type: "EVALUATION_ERROR",
        reason:
          error instanceof Error
            ? error.message
            : "Could not generate the final evaluation. Please retry.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]">
        <Loader2 className="animate-spin text-[var(--color-accent)]" size={32} />
      </div>
    );
  }

  if (sessionError || allQuestions.length === 0 || !resumeText) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-bg)] p-6 text-center text-[var(--color-text)]">
        <p>{sessionError ?? "Interview session data is incomplete."}</p>
        <Link href="/student/status" className="text-[var(--color-accent)] hover:underline">
          Back to applications
        </Link>
      </div>
    );
  }

  if (!identityVerified || sessionStatus === "VERIFYING") {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
        <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-3">
          <h1 className="text-base font-semibold">AI Interview</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {jobTitle || "Structured assessment"}
            {companyName ? ` · ${companyName}` : ""}
          </p>
        </header>
        <IdentityVerificationGate
          sessionId={numericSessionId!}
          hasEnrolledIdentity={hasEnrolledIdentity}
          webcamRef={webcamRef}
          onPermissionActivity={notifyPermissionActivity}
          onVerified={() => {
            setIdentityVerified(true);
            setHasEnrolledIdentity(true);
            if (identityPauseRemainingRef.current != null) {
              const deadline = Date.now() + identityPauseRemainingRef.current;
              identityPauseRemainingRef.current = null;
              setQuestionDeadlineAt(deadline);
              questionDeadlineRef.current = deadline;
              setQuestionSecondsRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
            } else {
              const deadline = Date.now() + QUESTION_SECONDS * 1000;
              timeoutFiredForDeadlineRef.current = null;
              setQuestionDeadlineAt(deadline);
              questionDeadlineRef.current = deadline;
              setQuestionSecondsRemaining(QUESTION_SECONDS);
              questionStartedAtRef.current = Date.now();
            }
            setWarning(null);
            setSessionStatus("RUNNING");
            sessionStatusRef.current = "RUNNING";
          }}
        />
      </div>
    );
  }

  const activeQuestion = allQuestions[currentQuestionIndex];

  return (
    <>
      <InterviewLayout
        question={activeQuestion?.question ?? ""}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={allQuestions.length}
        questionSecondsRemaining={questionSecondsRemaining}
        jobTitle={jobTitle}
        companyName={companyName}
        onSubmitAnswer={handleAnswerSubmit}
        finalEvaluation={finalEvaluation}
        pipelinePassed={pipelineResult?.passed}
        passThreshold={pipelineResult?.passThreshold}
        loading={loading}
        candidateInfo={candidateInfo}
        completedAnswers={responses.length}
        interviewTime={formatTime(elapsedSeconds)}
        cameraStatus={cameraStatus}
        integrityMonitorStatus={integrityMonitorStatus}
        tabLifelinesUsed={tabLifelinesUsed}
        tabLifelinesTotal={3}
        onCameraStatusChange={(status, reason) => {
          setCameraStatus(status);
          if (status === "Connected") {
            tabDetectorRef.current?.notifyCameraReady();
          }
          if (reason) {
            if (reason.type === "CAMERA_PERMISSION_DENIED") {
              notifyPermissionActivity();
            }
            handleConfirmedViolation(reason.type, reason.message);
          }
        }}
        micStatus={micStatus}
        onMicStatusChange={setMicStatus}
        sessionStatus={sessionStatus}
        paused={sessionStatus === "PAUSED"}
        warning={warning}
        onResume={() => {
          if (sessionStatus === "TERMINATED") return;
          // Identity pauses require a fresh verification before continuing.
          if (
            warning?.type === "IDENTITY_MISMATCH" ||
            warning?.type === "IDENTITY_FAILED"
          ) {
            setIdentityVerified(false);
            setWarning(null);
            setSessionStatus("VERIFYING");
            return;
          }
          if (identityPauseRemainingRef.current != null) {
            const deadline = Date.now() + identityPauseRemainingRef.current;
            identityPauseRemainingRef.current = null;
            setQuestionDeadlineAt(deadline);
            questionDeadlineRef.current = deadline;
          }
          setWarning(null);
          setSessionStatus("RUNNING");
        }}
        onDismissWarning={() => setWarning(null)}
        onRetryFinalEvaluation={retryFinalEvaluation}
        webcamRef={webcamRef}
        forceSubmitToken={forceSubmitToken}
        onPermissionActivity={notifyPermissionActivity}
      />
      {(sessionStatus === "COMPLETED" || sessionStatus === "TERMINATED") && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 gap-3">
          {sessionStatus === "COMPLETED" && pipelineResult?.chatUnlocked && (
            <Link
              href="/student/messages"
              className="rounded-lg bg-[var(--color-accent)] px-6 py-3 font-semibold text-[var(--color-accent-foreground)] shadow-[var(--shadow-md)]"
            >
              Message the recruiter
            </Link>
          )}
          <Link
            href={applicationId ? `/student/status/${applicationId}` : "/student/status"}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 font-semibold text-[var(--color-text)] shadow-[var(--shadow-md)]"
          >
            View application status
          </Link>
        </div>
      )}
    </>
  );
}
