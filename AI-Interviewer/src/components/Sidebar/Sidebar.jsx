import { Briefcase, Camera, Mic, TimerReset, User } from "lucide-react";
import GlassCard from "../Common/GlassCard";

const Row = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between gap-3 text-sm">
    <span className="flex items-center gap-2 text-slate-300">
      <Icon size={16} />
      {label}
    </span>
    <span className="max-w-[55%] truncate text-right font-medium text-white">{value}</span>
  </div>
);

const Sidebar = ({
  candidateInfo,
  jobTitle,
  companyName,
  cameraStatus,
  micStatus,
  interviewTime,
  questionSecondsRemaining,
  sessionStatus,
  completedAnswers,
  totalQuestions,
}) => (
  <div className="space-y-4">
    <GlassCard className="space-y-4">
      <div className="flex items-center gap-3">
        <User className="text-teal-300" />
        <div>
          <p className="text-xs uppercase tracking-widest text-teal-300">Candidate</p>
          <h2 className="text-lg font-semibold text-white">
            {candidateInfo?.candidateName || "Not available"}
          </h2>
        </div>
      </div>
      <Row icon={Briefcase} label="Job" value={jobTitle || "Not available"} />
      {companyName ? <Row icon={Briefcase} label="Company" value={companyName} /> : null}
    </GlassCard>
    <GlassCard className="space-y-3">
      <p className="text-xs uppercase tracking-widest text-teal-300">Live interview status</p>
      <Row icon={TimerReset} label="Elapsed time" value={interviewTime} />
      <Row
        icon={TimerReset}
        label="Question timer"
        value={`00:${String(Math.max(0, questionSecondsRemaining ?? 0)).padStart(2, "0")}`}
      />
      <Row icon={Camera} label="Camera" value={cameraStatus} />
      <Row icon={Mic} label="Microphone" value={micStatus} />
      <div className="border-t border-white/10 pt-3 text-sm">
        <span className="text-slate-300">Interview</span>
        <p className="mt-1 font-semibold text-white">{sessionStatus}</p>
        <p className="mt-1 text-slate-400">
          {completedAnswers}/{totalQuestions} answers submitted
        </p>
      </div>
    </GlassCard>
  </div>
);

export default Sidebar;
