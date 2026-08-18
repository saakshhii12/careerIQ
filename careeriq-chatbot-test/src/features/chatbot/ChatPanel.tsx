"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import ChatInterface from "./components/ChatInterface";
import { useChat } from "./hooks/useChat";

/**
 * ChatPanel
 * ------------------------------------------------------------------
 * The large, always-visible glassmorphism panel used as the main
 * focus of the landing page. Must be rendered inside a <ChatProvider>
 * (see hooks/useChat.tsx) — it shares state with <ChatbotWidget />,
 * so opening the floating button continues the same conversation.
 * ------------------------------------------------------------------
 */
export function ChatPanel() {
  const { showWelcomeMessage } = useChat();

  useEffect(() => {
    showWelcomeMessage();
  }, [showWelcomeMessage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="glass-panel glow-border mx-auto h-[620px] w-full max-w-2xl overflow-hidden rounded-[24px]"
    >
      <ChatInterface />
    </motion.div>
  );
}

export default ChatPanel;
