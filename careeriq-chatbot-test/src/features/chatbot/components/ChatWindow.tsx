"use client";

import { motion } from "framer-motion";
import ChatInterface from "./ChatInterface";

interface ChatWindowProps {
  onClose: () => void;
}

const windowVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 16, scale: 0.96 },
};

export function ChatWindow({ onClose }: ChatWindowProps) {
  return (
    <motion.div
      variants={windowVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.22, ease: "easeOut" }}
      role="dialog"
      aria-label="CareerIQ Assistant chat window"
      className="glass-panel glow-border absolute bottom-[76px] right-0 h-[560px] max-h-[calc(100vh-140px)] w-[380px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[20px]"
    >
      <ChatInterface onClose={onClose} />
    </motion.div>
  );
}

export default ChatWindow;
