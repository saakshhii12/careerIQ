import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Clock3,
  Target,
  Sparkles,
  Volume2,
} from "lucide-react";

import GlassCard from "../Common/GlassCard";
import { speak } from "../../utils/speech";

const QuestionCard = ({
  question,
  questionNumber,
  totalQuestions,
  onSpeechEnd,
}) => {
  const progress = totalQuestions > 0 ? (questionNumber / totalQuestions) * 100 : 0;

  const [seconds, setSeconds] = useState(120);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Reset timer for every question
  useEffect(() => {
    setSeconds(120);
  }, [questionNumber]);

  // Countdown timer
  useEffect(() => {
    if (seconds <= 0) return;

    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  // Speak every new question
  useEffect(() => {
    if (!question) return;

    setIsSpeaking(true);

    speak(question, () => {
      setIsSpeaking(false);
      if (onSpeechEnd) {
        onSpeechEnd();
      }
    });

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [question]);

  const replayQuestion = () => {
    if (!question) return;
    setIsSpeaking(true);

    speak(question, () => {
      setIsSpeaking(false);
    });
  };

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainingSeconds = String(seconds % 60).padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-500/20 p-3">
              <BrainCircuit
                className="text-teal-300"
                size={22}
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-teal-300">
                AI Interview
              </p>

              <h2 className="text-xl font-semibold text-white">
                Question {questionNumber} of {totalQuestions}
              </h2>
            </div>
          </div>

          <span className="rounded-full bg-yellow-500/20 px-4 py-1 text-sm text-yellow-300 font-medium">
            Medium
          </span>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-slate-400 text-sm">
              Interview Progress
            </span>

            <span className="text-teal-300 text-sm font-semibold">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-700 overflow-hidden">
            <motion.div
              className="h-full bg-teal-400"
              animate={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <Clock3 className="text-teal-300" />

            <div>
              <p className="text-sm text-slate-400">
                Remaining Time
              </p>

              <p
                className={`text-2xl font-bold ${
                  seconds <= 30
                    ? "text-red-400"
                    : "text-teal-300"
                }`}
              >
                {minutes}:{remainingSeconds}
              </p>
            </div>
          </div>

          <button
            onClick={replayQuestion}
            title="Replay question audio"
            className="rounded-full bg-teal-500/20 p-3 hover:bg-teal-500/40 transition cursor-pointer"
          >
            <Volume2
              className="text-teal-300"
              size={22}
            />
          </button>
        </div>

        {/* Speaking Status */}
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="
              flex
              items-center
              gap-3
              rounded-xl
              border
              border-teal-400/30
              bg-teal-500/10
              p-4
            "
          >
            <Volume2
              className="text-teal-300 animate-pulse"
              size={24}
            />

            <div>
              <p className="font-semibold text-teal-300">
                AI Interviewer
              </p>

              <p className="text-slate-300">
                Speaking Question...
              </p>
            </div>
          </motion.div>
        )}

        {/* Question Text */}
        <div>
          <p className="text-2xl leading-10 font-medium text-white">
            {question}
          </p>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles
                size={18}
                className="text-teal-300"
              />

              <span className="text-sm text-slate-400">
                Category
              </span>
            </div>

            <p className="font-semibold text-white">
              Technical
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target
                size={18}
                className="text-teal-300"
              />

              <span className="text-sm text-slate-400">
                Skill
              </span>
            </div>

            <p className="font-semibold text-white">
              AI Generated
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock3
                size={18}
                className="text-teal-300"
              />

              <span className="text-sm text-slate-400">
                Time Limit
              </span>
            </div>

            <p className="font-semibold text-white">
              2 Minutes
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default QuestionCard;