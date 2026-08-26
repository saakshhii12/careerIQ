import GlassCard from "../Common/GlassCard";
const ProgressBar = ({ currentQuestion, totalQuestions }) => { const progress = Math.round((currentQuestion / totalQuestions) * 100); return <GlassCard><div className="flex justify-between text-sm"><span className="text-slate-400">Interview progress</span><span className="text-white">{currentQuestion}/{totalQuestions} · {progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded bg-white/10"><div className="h-full bg-teal-400 transition-all" style={{ width: `${progress}%` }} /></div></GlassCard>; };
export default ProgressBar;
