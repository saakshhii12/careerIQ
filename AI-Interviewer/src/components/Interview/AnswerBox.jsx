import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mic,
  Send,
  LoaderCircle,
  SquarePen,
  ArrowRight,
  Star,
  MicOff,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

import GlassCard from "../Common/GlassCard";

const MAX_CHARACTERS = 1000;

const AnswerBox = ({
  onSubmitAnswer,
  evaluation,
  loading,
  onNextQuestion,
  autoRecord,
  onAutoRecordComplete,
  isLastQuestion = false,
}) => {
  const [answer, setAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState("");

  const recognitionRef = useRef(null);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    onSubmitAnswer(answer);
    setAnswer("");
  };

  const startRecording = () => {
    setSpeechError("");
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in your browser. Please type your answer or use Google Chrome/Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        setAnswer(transcript.trim());
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        console.warn("Speech Recognition Error:", event.error);
        setIsRecording(false);
        if (event.error === "not-allowed") {
          setSpeechError("Microphone access was denied. Please allow microphone permissions in your browser.");
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Speech recognition startup error:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Safe ignore
      }
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (autoRecord) {
      startRecording();
      if (onAutoRecordComplete) {
        onAutoRecordComplete();
      }
    }
  }, [autoRecord]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <GlassCard className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-500/20 p-3">
            <SquarePen className="text-teal-300" size={22} />
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-teal-300">
              Candidate Response
            </p>

            <h2 className="text-xl font-semibold text-white">
              Your Answer
            </h2>
          </div>
        </div>

        {/* Speech Error Banner */}
        {speechError && (
          <div className="flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-200">
            <AlertTriangle size={16} className="shrink-0 text-yellow-400" />
            <span>{speechError}</span>
          </div>
        )}

        {/* Text Area */}
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={loading || Boolean(evaluation)}
          placeholder="Type or dictate your response here (e.g. key concepts, architectural decisions, trade-offs)..."
          maxLength={MAX_CHARACTERS}
          className="
            w-full
            h-48
            resize-none
            rounded-2xl
            border
            border-white/10
            bg-white/5
            p-5
            text-white
            placeholder:text-slate-500
            outline-none
            focus:border-teal-400
            focus:ring-2
            focus:ring-teal-400/20
            transition-all
            disabled:opacity-60
          "
        />

        {/* Footer Controls */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-400">
            {answer.length}/{MAX_CHARACTERS} characters
          </p>

          <div className="flex gap-3">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={loading || Boolean(evaluation)}
                className="
                  flex items-center gap-2
                  rounded-xl
                  border
                  border-white/10
                  bg-white/5
                  px-5
                  py-3
                  text-white
                  hover:border-red-400
                  hover:bg-red-400/10
                  transition
                  disabled:opacity-50
                  cursor-pointer
                "
              >
                <Mic size={18} />
                Record
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="
                  flex items-center gap-2
                  rounded-xl
                  bg-red-500
                  px-5
                  py-3
                  text-white
                  animate-pulse
                  cursor-pointer
                "
              >
                <MicOff size={18} />
                Listening... (Click to Stop)
              </button>
            )}

            {!evaluation && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !answer.trim()}
                className="
                  flex items-center gap-2
                  rounded-xl
                  bg-teal-400
                  px-6
                  py-3
                  font-semibold
                  text-slate-900
                  hover:scale-105
                  transition
                  disabled:opacity-50
                  cursor-pointer
                "
              >
                {loading ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    AI Evaluating...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Submit Answer
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* AI Feedback Card */}
        {evaluation && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              rounded-2xl
              border
              ${evaluation.isError ? 'border-red-400/30 bg-red-500/10' : 'border-teal-400/30 bg-teal-500/10'}
              p-6
              space-y-5
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star
                  className={evaluation.isError ? "text-red-400" : "text-yellow-400"}
                  size={22}
                />
                <h3 className="text-xl font-bold text-white">
                  AI Evaluation
                </h3>
              </div>

              {!evaluation.isError && (
                <div className="flex items-center gap-1 rounded-full bg-teal-400/20 px-3 py-1 text-sm font-semibold text-teal-300">
                  <span>Score:</span>
                  <span className="text-white text-base">{evaluation.score}</span>
                  <span className="text-slate-400">/10</span>
                </div>
              )}
            </div>

            <p className="text-slate-300 leading-relaxed">
              {evaluation.feedback}
            </p>

            {/* Strengths */}
            {evaluation.strengths && evaluation.strengths.length > 0 && (
              <div className="space-y-2 rounded-xl bg-white/5 p-4 border border-white/10">
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-300">
                  <CheckCircle2 size={16} />
                  <span>Key Strengths:</span>
                </div>
                <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                  {evaluation.strengths.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {evaluation.improvements && evaluation.improvements.length > 0 && (
              <div className="space-y-2 rounded-xl bg-white/5 p-4 border border-white/10">
                <div className="flex items-center gap-2 text-sm font-semibold text-yellow-300">
                  <Lightbulb size={16} />
                  <span>Areas for Improvement:</span>
                </div>
                <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                  {evaluation.improvements.map((imp, idx) => (
                    <li key={idx}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={onNextQuestion}
              className="
                mt-4
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-teal-400
                px-6
                py-3.5
                font-semibold
                text-slate-900
                hover:scale-[1.02]
                transition
                w-full
                sm:w-auto
                cursor-pointer
              "
            >
              <span>{isLastQuestion ? "Complete Interview" : "Next Question"}</span>
              <ArrowRight size={18} />
            </button>
          </motion.div>
        )}
      </GlassCard>
    </motion.div>
  );
};

export default AnswerBox;