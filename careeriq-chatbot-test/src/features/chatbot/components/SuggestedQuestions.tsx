"use client";

import { motion } from "framer-motion";

interface SuggestedQuestionsProps {
  questions: readonly string[];
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export function SuggestedQuestions({ questions, onSelect, disabled }: SuggestedQuestionsProps) {
  if (!questions?.length) return null;

  return (
    <div className="relative z-10 flex flex-wrap gap-2 px-4 pb-3">
      {questions.map((q) => (
        <motion.button
          type="button"
          key={q}
          onClick={() => !disabled && onSelect(q)}
          whileTap={{ scale: 0.96 }}
          disabled={disabled}
          className="rounded-full border border-accent/30 bg-accent/[0.06] px-3 py-1.5 text-[11.5px] text-accent transition hover:-translate-y-px hover:bg-accent/[0.14] hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
        >
          {q}
        </motion.button>
      ))}
    </div>
  );
}

export default SuggestedQuestions;
