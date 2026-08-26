import { useEffect, useRef, useState } from "react";
import { BrainCircuit, Volume2 } from "lucide-react";
import GlassCard from "../Common/GlassCard";
import { speak } from "../../utils/speech";
const QuestionCard = ({ question, questionNumber, totalQuestions }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const spokenQuestionRef = useRef(null);
  useEffect(() => {
    const key = `${questionNumber}:${question}`;
    if (!question || spokenQuestionRef.current === key) return undefined;
    spokenQuestionRef.current = key; setIsSpeaking(true);
    speak(question, () => setIsSpeaking(false));
    return () => window.speechSynthesis?.cancel();
  }, [question, questionNumber]);
  const replay = () => { setIsSpeaking(true); speak(question, () => setIsSpeaking(false)); };
  const progress = Math.round((questionNumber / totalQuestions) * 100);
  return <GlassCard className="space-y-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="rounded-xl bg-teal-500/20 p-2"><BrainCircuit className="text-teal-300" size={20} /></div><div><p className="text-xs uppercase tracking-widest text-teal-300">Current question</p><h2 className="text-lg font-semibold text-white">Question {questionNumber} of {totalQuestions}</h2></div></div><button onClick={replay} className="flex items-center gap-2 rounded-xl bg-teal-500/20 px-3 py-2 text-sm text-teal-200" title="Repeat Question"><Volume2 size={17} />Repeat</button></div><div><div className="mb-1 flex justify-between text-xs text-slate-400"><span>Question progress</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded bg-white/10"><div className="h-full bg-teal-400" style={{ width: `${progress}%` }} /></div></div>{isSpeaking && <p className="text-sm text-teal-300">Speaking question…</p>}<p className="text-xl leading-8 font-medium text-white">{question}</p></GlassCard>;
};
export default QuestionCard;
