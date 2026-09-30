import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import InterviewLayout from "../components/Interview/InterviewLayout";
import { generateFinalEvaluation, completeInterviewSession } from "../services/evaluationService";
import { createIntegrityMonitor } from "../services/integrityMonitor";
import { createTabVisibilityDetector } from "../services/tabVisibility";
import { createViolationManager } from "../services/violationManager";

const QUESTION_SECONDS = 30;

const formatTime = (totalSeconds) =>
  `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;

const InterviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const allQuestions = location.state?.questions || [];
  const resumeText = location.state?.resumeText || "";
  const candidateInfo = location.state?.candidateInfo || null;
  const interviewSessionId = location.state?.sessionId || null;
  const jobTitle = location.state?.jobTitle || location.state?.job?.jobTitle || "";
  const companyName = location.state?.companyName || location.state?.job?.companyName || "";

  const getQuestionText = (q) => (typeof q === "string" ? q : q?.question ?? "");
  const getQuestionId = (q, idx) => (typeof q === "object" && q?.questionId ? q.questionId : idx + 1);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const responsesRef = useRef([]);
  const [finalEvaluation, setFinalEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState("RUNNING");
  const sessionStatusRef = useRef("RUNNING");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cameraStatus, setCameraStatus] = useState("Connecting");
  const [micStatus, setMicStatus] = useState("OFF");
  const [warning, setWarning] = useState(null);
  const [integrityEvents, setIntegrityEvents] = useState([]);
  const [questionDeadlineAt, setQuestionDeadlineAt] = useState(() => Date.now() + QUESTION_SECONDS * 1000);
  const [questionSecondsRemaining, setQuestionSecondsRemaining] = useState(QUESTION_SECONDS);
  const [forceSubmitToken, setForceSubmitToken] = useState(0);

  const windowSwitchCountRef = useRef(0);
  const webcamRef = useRef(null);
  const tabDetectorRef = useRef(null);
  const violationManagerRef = useRef(createViolationManager());
  const advancingRef = useRef(false);
  const questionDeadlineRef = useRef(questionDeadlineAt);
  const currentIndexRef = useRef(0);
  const timeoutFiredForDeadlineRef = useRef(null);

  useEffect(() => {
    sessionStatusRef.current = sessionStatus;
  }, [sessionStatus]);

  useEffect(() => {
    questionDeadlineRef.current = questionDeadlineAt;
  }, [questionDeadlineAt]);

  useEffect(() => {
    currentIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  const recordEvent = useCallback(
    (type, reason, details = {}) => {
      setIntegrityEvents((events) => [...events, { type, reason, details, at: new Date().toISOString() }]);
      const token = window.localStorage.getItem("careeriq_token");
      if (interviewSessionId && token) {
        fetch(`http://localhost:5000/api/interviews/sessions/${interviewSessionId}/integrity-events`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ eventType: type, severity: "high", details: { reason, ...details } }),
        }).catch(() => {});
      }
    },
    [interviewSessionId]
  );

  const handleConfirmedViolation = useCallback(
    (type, reason, details = {}) => {
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
        windowSwitchCountRef.current = decision.lifelinesUsed || decision.warningCount;
      }
      recordEvent(type, reason, {
        ...details,
        warningCount: decision.warningCount,
        lifelinesUsed: decision.lifelinesUsed,
        lifelinesTotal: decision.lifelinesTotal,
      });

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
          windowSwitchCount: windowSwitchCountRef.current || undefined,
        });
        return;
      }

      if (decision.shouldPause && sessionStatusRef.current === "RUNNING") {
        window.speechSynthesis?.cancel();
        setMicStatus("OFF");
        setWarning({
          type,
          reason: decision.message,
          windowSwitchCount: windowSwitchCountRef.current || undefined,
        });
        setSessionStatus("PAUSED");
      }
    },
    [recordEvent]
  );

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

  useEffect(() => {
    if (sessionStatus !== "RUNNING" || cameraStatus !== "Connected") return undefined;
    let cancelled = false;
    let dispose;
    let pollTimer;

    const start = async () => {
      const video = webcamRef.current?.video;
      if (!video || video.readyState < 2 || video.videoWidth === 0) {
        pollTimer = setTimeout(() => {
          if (!cancelled) void start();
        }, 250);
        return;
      }
      try {
        const handle = await createIntegrityMonitor(video, ({ type, reason, details }) =>
          handleConfirmedViolation(type, reason, details)
        );
        if (cancelled) {
          handle.dispose?.() || handle();
          return;
        }
        dispose = typeof handle === "function" ? handle : () => handle.dispose();
      } catch (error) {
        console.warn("Integrity monitoring unavailable:", error.message);
      }
    };

    void start();
    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
      dispose?.();
    };
  }, [cameraStatus, handleConfirmedViolation, sessionStatus]);

  useEffect(() => {
    if (sessionStatus !== "RUNNING") return undefined;
    const interval = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [sessionStatus]);

  // Wall-clock per-question countdown — keeps ticking even while paused.
  useEffect(() => {
    if (allQuestions.length === 0) return undefined;
    if (sessionStatus === "COMPLETED" || sessionStatus === "EVALUATING" || sessionStatus === "ERROR") {
      return undefined;
    }

    const tick = () => {
      const deadline = questionDeadlineRef.current;
      const remainingMs = deadline - Date.now();
      const secs = Math.max(0, Math.ceil(remainingMs / 1000));
      setQuestionSecondsRemaining(secs);
      if (secs <= 0 && !advancingRef.current && timeoutFiredForDeadlineRef.current !== deadline) {
        timeoutFiredForDeadlineRef.current = deadline;
        setForceSubmitToken((token) => token + 1);
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [allQuestions.length, sessionStatus, currentQuestionIndex]);

  const handleAnswerSubmit = async (answer) => {
    if (advancingRef.current) return;
    if (sessionStatusRef.current !== "RUNNING" && sessionStatusRef.current !== "PAUSED") return;
    advancingRef.current = true;
    window.speechSynthesis?.cancel();

    const index = currentIndexRef.current;
    const response = { question: getQuestionText(allQuestions[index]), answer };
    const nextResponses = [...responsesRef.current, response];
    responsesRef.current = nextResponses;
    setResponses(nextResponses);
    setLoading(true);

    if (index < allQuestions.length - 1) {
      const nextIndex = index + 1;
      const deadline = Date.now() + QUESTION_SECONDS * 1000;
      timeoutFiredForDeadlineRef.current = null;
      setCurrentQuestionIndex(nextIndex);
      currentIndexRef.current = nextIndex;
      setQuestionDeadlineAt(deadline);
      questionDeadlineRef.current = deadline;
      setQuestionSecondsRemaining(QUESTION_SECONDS);
      setLoading(false);
      advancingRef.current = false;
      return;
    }

    setSessionStatus("EVALUATING");
    try {
      let result;
      if (interviewSessionId) {
        const dbAnswers = nextResponses.map((r, idx) => ({
          questionId: getQuestionId(allQuestions[idx], idx),
          answer: r.answer,
        }));
        result = await completeInterviewSession(interviewSessionId, dbAnswers, {
          durationSeconds: elapsedSeconds,
          integrityEvents,
        });
      } else {
        result = await generateFinalEvaluation(resumeText, nextResponses, {
          durationSeconds: elapsedSeconds,
          integrityEvents,
        });
      }
      setFinalEvaluation(result);
      setSessionStatus("COMPLETED");
    } catch (error) {
      console.error("Final interview evaluation failed:", error);
      setSessionStatus("ERROR");
      setWarning({
        type: "EVALUATION_ERROR",
        reason: error.message || "Qwen could not generate the final evaluation. Please retry.",
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
      let result;
      if (interviewSessionId) {
        const dbAnswers = responsesRef.current.map((r, idx) => ({
          questionId: getQuestionId(allQuestions[idx], idx),
          answer: r.answer,
        }));
        result = await completeInterviewSession(interviewSessionId, dbAnswers, {
          durationSeconds: elapsedSeconds,
          integrityEvents,
        });
      } else {
        result = await generateFinalEvaluation(resumeText, responsesRef.current, {
          durationSeconds: elapsedSeconds,
          integrityEvents,
        });
      }
      setFinalEvaluation(result);
      setSessionStatus("COMPLETED");
    } catch (error) {
      setSessionStatus("ERROR");
      setWarning({
        type: "EVALUATION_ERROR",
        reason: error.message || "Qwen could not generate the final evaluation. Please retry.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (allQuestions.length === 0 || !resumeText) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1220] p-6 text-center text-white">
        No resume-based interview questions found. Return to upload a resume and generate questions with Qwen.
      </div>
    );
  }

  return (
    <InterviewLayout
      question={getQuestionText(allQuestions[currentQuestionIndex])}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={allQuestions.length}
      questionSecondsRemaining={questionSecondsRemaining}
      jobTitle={jobTitle}
      companyName={companyName}
      onSubmitAnswer={handleAnswerSubmit}
      finalEvaluation={finalEvaluation}
      loading={loading}
      candidateInfo={candidateInfo}
      completedAnswers={responses.length}
      interviewTime={formatTime(elapsedSeconds)}
      cameraStatus={cameraStatus}
      onCameraStatusChange={(status, reason) => {
        setCameraStatus(status);
        if (status === "Connected") tabDetectorRef.current?.notifyCameraReady();
        if (reason) {
          tabDetectorRef.current?.notifyPermissionActivity();
          handleConfirmedViolation(reason.type, reason.message);
        }
      }}
      micStatus={micStatus}
      onMicStatusChange={setMicStatus}
      sessionStatus={sessionStatus}
      paused={sessionStatus === "PAUSED"}
      integrityEvents={integrityEvents}
      warning={warning}
      onResume={() => {
        setWarning(null);
        setSessionStatus("RUNNING");
      }}
      onDismissWarning={() => setWarning(null)}
      onRetryFinalEvaluation={retryFinalEvaluation}
      webcamRef={webcamRef}
      forceSubmitToken={forceSubmitToken}
      onPermissionActivity={() => tabDetectorRef.current?.notifyPermissionActivity()}
    />
  );
};

export default InterviewPage;
