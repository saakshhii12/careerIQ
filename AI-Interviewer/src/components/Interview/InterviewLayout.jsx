import LeftPanel from "./LeftPanel";
import CenterPanel from "./CenterPanel";
import RightPanel from "./RightPanel";
import BottomPanel from "./BottomPanel";

const WarningOverlay = ({ warning, onResume, onRetry, onDismiss, canResume }) => {
  if (!warning) return null;

  if (warning.soft) {
    return (
      <div className="fixed bottom-20 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl border border-amber-400/50 bg-[#111c2f] p-4 shadow-2xl">
        <p className="text-sm font-semibold text-amber-200">Interview Warning</p>
        <p className="mt-1 text-sm text-slate-300">{warning.reason}</p>
        <button
          onClick={onDismiss}
          className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
        >
          Continue
        </button>
      </div>
    );
  }

  const title =
    warning.type === "INTERVIEW_TERMINATED"
      ? "Interview Ended"
      : warning.type === "EVALUATION_ERROR"
        ? "Evaluation unavailable"
        : "Interview Paused";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-400/50 bg-[#111c2f] p-6 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-300">Security</p>
        <h2 className="mt-2 text-2xl font-bold text-white">{title}</h2>
        <p className="mt-4 text-slate-200">Reason: {warning.reason}</p>
        {warning.windowSwitchCount || warning.lifelinesUsed ? (
          <p className="mt-2 text-sm text-amber-200">
            Lifelines used: {warning.lifelinesUsed || warning.windowSwitchCount} of{" "}
            {warning.lifelinesTotal || 3}.
          </p>
        ) : null}
        {warning.type === "EVALUATION_ERROR" ? (
          <button
            onClick={onRetry}
            className="mt-6 rounded-xl bg-teal-400 px-5 py-3 font-semibold text-slate-900"
          >
            Retry final evaluation
          </button>
        ) : warning.type !== "INTERVIEW_TERMINATED" ? (
          <button
            onClick={onResume}
            disabled={!canResume}
            className="mt-6 rounded-xl bg-teal-400 px-5 py-3 font-semibold text-slate-900 disabled:opacity-50"
          >
            Resume interview
          </button>
        ) : null}
      </div>
    </div>
  );
};

const InterviewLayout = (props) => (
  <div className="min-h-screen bg-[#0B1220] text-white">
    <div className="min-h-screen bg-[linear-gradient(rgba(100,210,200,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(100,210,200,0.05)_1px,transparent_1px)] bg-[size:40px_40px]">
      <main className="mx-auto max-w-[1500px] p-3 lg:p-4">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Interview</h1>
            <p className="text-sm text-slate-400">
              {props.jobTitle || "Structured assessment session"}
              {props.companyName ? ` · ${props.companyName}` : ""}
            </p>
          </div>
          <span className="text-sm font-semibold text-teal-300">{props.sessionStatus}</span>
        </header>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[250px_minmax(0,1fr)_360px]">
          <LeftPanel
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
          />
          <CenterPanel
            question={props.question}
            questionNumber={props.questionNumber}
            totalQuestions={props.totalQuestions}
            questionSecondsRemaining={props.questionSecondsRemaining}
            jobTitle={props.jobTitle}
            onSubmitAnswer={props.onSubmitAnswer}
            loading={props.loading}
            paused={props.paused}
            sessionStatus={props.sessionStatus}
            onMicStatusChange={props.onMicStatusChange}
            forceSubmitToken={props.forceSubmitToken}
            onPermissionActivity={props.onPermissionActivity}
          />
          <RightPanel
            webcamRef={props.webcamRef}
            evaluation={props.finalEvaluation}
            cameraStatus={props.cameraStatus}
            onCameraStatusChange={props.onCameraStatusChange}
            onPermissionActivity={props.onPermissionActivity}
          />
        </div>
        <BottomPanel currentQuestion={props.completedAnswers} totalQuestions={props.totalQuestions} />
      </main>
    </div>
    <WarningOverlay
      warning={props.warning}
      onResume={props.onResume}
      onRetry={props.onRetryFinalEvaluation}
      onDismiss={props.onDismissWarning}
      canResume={props.cameraStatus === "Connected"}
    />
  </div>
);

export default InterviewLayout;
