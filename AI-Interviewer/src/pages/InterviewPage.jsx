import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import InterviewLayout from "../components/Interview/InterviewLayout";
import { generateFinalEvaluation } from "../services/evaluationService";
import { createIntegrityMonitor } from "../services/integrityMonitor";

const formatTime = (totalSeconds) =>
  `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;

const InterviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const allQuestions = location.state?.questions || [];
  const resumeText = location.state?.resumeText || "";
  const candidateInfo = location.state?.candidateInfo || null;
  const interviewSessionId = location.state?.sessionId || null;
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
  const windowSwitchCountRef = useRef(0);
  const lastWindowSwitchRef = useRef(0);
  const terminationTimeoutRef = useRef(null);
  const webcamRef = useRef(null);

  useEffect(() => {
    sessionStatusRef.current = sessionStatus;
  }, [sessionStatus]);

  useEffect(() => () => window.clearTimeout(terminationTimeoutRef.current), []);

  const pauseForIntegrity = useCallback((type, reason, details = {}) => {
    if (sessionStatusRef.current !== "RUNNING") return;
    window.speechSynthesis?.cancel();
    const isWindowSwitch = type === "TAB_SWITCH" || type === "WINDOW_BLUR";
    const now = Date.now();
    if (isWindowSwitch && now - lastWindowSwitchRef.current < 1000) return;
    if (isWindowSwitch) {
      lastWindowSwitchRef.current = now;
      windowSwitchCountRef.current += 1;
    }
    setIntegrityEvents((events) => [...events, { type, reason, details, at: new Date().toISOString() }]);
    const token = window.localStorage.getItem("careeriq_token");
    if (interviewSessionId && token) {
      fetch(`http://localhost:5000/api/interviews/sessions/${interviewSessionId}/integrity-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ eventType: type, severity: "high", details: { reason, ...details } }),
      }).catch(() => {});
    }
    if (windowSwitchCountRef.current >= 3) {
      setWarning({ type: "INTERVIEW_TERMINATED", reason: "Interview ended after three window-switch violations." });
      setSessionStatus("ERROR");
      setMicStatus("OFF");
      terminationTimeoutRef.current = window.setTimeout(() => navigate("/resume", { replace: true }), 1800);
      return;
    }
    setWarning({ type, reason, windowSwitchCount: windowSwitchCountRef.current });
    setSessionStatus("PAUSED");
    setMicStatus("OFF");
  }, [interviewSessionId, navigate]);

  useEffect(() => {
    const video = webcamRef.current?.video;
    if (sessionStatus !== "RUNNING" || cameraStatus !== "Connected" || !video) return undefined;
    let dispose;
    createIntegrityMonitor(video, ({ type, reason, details }) => pauseForIntegrity(type, reason, details))
      .then((cleanup) => { dispose = cleanup; })
      .catch((error) => console.warn("Integrity monitoring unavailable:", error.message));
    return () => dispose?.();
  }, [cameraStatus, pauseForIntegrity, sessionStatus]);

  useEffect(() => {
    if (sessionStatus !== "RUNNING") return undefined;
    const interval = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [sessionStatus]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) pauseForIntegrity("TAB_SWITCH", "You left the interview window.");
    };
    const onWindowBlur = () => {
      if (!document.hidden) pauseForIntegrity("WINDOW_BLUR", "The interview window lost focus.");
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) pauseForIntegrity("FULLSCREEN_EXIT", "Fullscreen mode was exited.");
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [pauseForIntegrity]);

  const handleAnswerSubmit = async (answer) => {
    if (loading || sessionStatus !== "RUNNING") return;
    const response = { question: allQuestions[currentQuestionIndex], answer };
    const nextResponses = [...responsesRef.current, response];
    responsesRef.current = nextResponses;
    setResponses(nextResponses);
    setLoading(true);
    window.speechSynthesis?.cancel();

    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex((index) => index + 1);
      setLoading(false);
      return;
    }

    setSessionStatus("EVALUATING");
    try {
      const result = await generateFinalEvaluation(resumeText, nextResponses, {
        durationSeconds: elapsedSeconds,
        integrityEvents,
      });
      setFinalEvaluation(result);
      setSessionStatus("COMPLETED");
    } catch (error) {
      console.error("Final interview evaluation failed:", error);
    setSessionStatus("ERROR");
      setWarning({ type: "EVALUATION_ERROR", reason: error.message || "Qwen could not generate the final evaluation. Please retry." });
    } finally {
      setLoading(false);
    }
  };

  const retryFinalEvaluation = async () => {
    setWarning(null);
    setLoading(true);
    setSessionStatus("EVALUATING");
    try {
      const result = await generateFinalEvaluation(resumeText, responsesRef.current, { durationSeconds: elapsedSeconds, integrityEvents });
      setFinalEvaluation(result);
      setSessionStatus("COMPLETED");
    } catch (error) {
      setSessionStatus("ERROR");
      setWarning({ type: "EVALUATION_ERROR", reason: error.message || "Qwen could not generate the final evaluation. Please retry." });
    } finally { setLoading(false); }
  };

  if (allQuestions.length === 0 || !resumeText) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0B1220] p-6 text-center text-white">No resume-based interview questions found. Return to upload a resume and generate questions with Qwen.</div>;
  }

  return <InterviewLayout
    question={allQuestions[currentQuestionIndex]}
    questionNumber={currentQuestionIndex + 1}
    totalQuestions={allQuestions.length}
    onSubmitAnswer={handleAnswerSubmit}
    finalEvaluation={finalEvaluation}
    loading={loading}
    candidateInfo={candidateInfo}
    completedAnswers={responses.length}
    interviewTime={formatTime(elapsedSeconds)}
    cameraStatus={cameraStatus}
    onCameraStatusChange={(status, reason) => {
      setCameraStatus(status);
      if (reason) pauseForIntegrity(reason.type, reason.message);
    }}
    micStatus={micStatus}
    onMicStatusChange={setMicStatus}
    sessionStatus={sessionStatus}
    paused={sessionStatus === "PAUSED"}
    integrityEvents={integrityEvents}
    warning={warning}
    onResume={() => { setWarning(null); setSessionStatus("RUNNING"); }}
    onRetryFinalEvaluation={retryFinalEvaluation}
    webcamRef={webcamRef}
  />;
};

export default InterviewPage;
