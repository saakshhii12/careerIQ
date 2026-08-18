"use client";

import { motion } from "framer-motion";

const dotTransition = (delay: number) => ({
  duration: 0.9,
  repeat: Infinity,
  ease: "easeInOut" as const,
  delay,
});

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex max-w-[84%] flex-col self-start items-start"
    >
      <div
        className="flex w-fit items-center gap-1 rounded-2xl rounded-tl-md border border-accent/20 bg-white/5 px-3.5 py-3"
        aria-label="Assistant is typing"
      >
        {[0, 0.15, 0.3].map((delay, i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-accent"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={dotTransition(delay)}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default TypingIndicator;
