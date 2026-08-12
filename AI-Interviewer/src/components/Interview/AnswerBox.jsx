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
}) =>  {
  const [answer, setAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");

  const recognitionRef = useRef(null);

  const handleSubmit = () => {
    if (!answer.trim()) return;

    onSubmitAnswer(answer);

    setAnswer("");
  };

  const startRecording = () => {
    setRecordingError("");

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecordingError(
        "Voice input is not supported in this browser. Use Chrome or Edge on localhost, or type your answer."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognitionRef.current = recognition;

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.start();

    setIsRecording(true);

    recognition.onresult = (event) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setAnswer(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      setIsRecording(false);
      setRecordingError(
        event?.error === "not-allowed"
          ? "Microphone access was blocked. Allow mic permission for this site and try again."
          : "Voice input could not start. Try the Record button again, or type your answer."
      );
    };
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (autoRecord) {
      startRecording();
      onAutoRecordComplete();
    }
  }, [autoRecord, onAutoRecordComplete]);

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

        {/* Text Area */}

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={loading || evaluation}
          placeholder="Type your answer here..."
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

        {/* Footer */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <p className="text-sm text-slate-400">
            {answer.length}/{MAX_CHARACTERS} characters
          </p>

          <div className="flex gap-3">

            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={loading || evaluation}
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
                "
              >
                <Mic size={18} />
                Record
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="
                  flex items-center gap-2
                  rounded-xl
                  bg-red-500
                  px-5
                  py-3
                  text-white
                  animate-pulse
                "
              >
                <MicOff size={18} />
                Listening...
              </button>
            )}

            {!evaluation && (
              <button
                onClick={handleSubmit}
                disabled={loading}
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
                  disabled:opacity-60
                "
              >
                {loading ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    AI Thinking...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Submit
                  </>
                )}
              </button>
            )}

          </div>

        </div>

        {recordingError && (
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            {recordingError}
          </div>
        )}

        {/* AI Feedback */}

        {evaluation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="
              rounded-2xl
              border
              border-teal-400/30
              bg-teal-500/10
              p-6
            "
          >
            <div className="flex items-center gap-2 mb-4">

              <Star
                className="text-yellow-400"
                size={22}
              />

              <h3 className="text-xl font-bold text-white">
                AI Evaluation
              </h3>

            </div>

            <p className="text-2xl font-bold text-teal-300 mb-4">
              ⭐ Score : {evaluation.score}/10
            </p>

            <p className="text-slate-300 leading-8">
              {evaluation.feedback}
            </p>

            <button
              onClick={onNextQuestion}
              className="
                mt-6
                flex
                items-center
                gap-2
                rounded-xl
                bg-teal-400
                px-6
                py-3
                font-semibold
                text-slate-900
                hover:scale-105
                transition
              "
            >
              Next Question
              <ArrowRight size={18} />
            </button>

          </motion.div>
        )}

      </GlassCard>
    </motion.div>
  );
};

export default AnswerBox;
