"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X } from "lucide-react";

interface ChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function ChatButton({ isOpen, onClick }: ChatButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.93 }}
      aria-label={isOpen ? "Close chat" : "Open chat"}
      aria-expanded={isOpen}
      className="relative flex h-14 w-14 items-center justify-center rounded-full border border-accent/40 bg-gradient-to-br from-navy-secondary to-navy text-accent shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:border-accent hover:shadow-glow"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isOpen ? "close" : "open"}
          initial={{ opacity: 0, rotate: -45 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={{ opacity: 0, rotate: 45 }}
          transition={{ duration: 0.15 }}
          className="flex"
        >
          {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
        </motion.span>
      </AnimatePresence>
      {!isOpen && (
        <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-accent shadow-glow" />
      )}
    </motion.button>
  );
}

export default ChatButton;
