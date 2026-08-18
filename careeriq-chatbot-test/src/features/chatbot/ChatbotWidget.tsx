"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import ChatButton from "./components/ChatButton";
import ChatWindow from "./components/ChatWindow";
import { useChat } from "./hooks/useChat";

/**
 * ChatbotWidget
 * ------------------------------------------------------------------
 * The floating entry point: a fixed bottom-right button that expands
 * into a small chat window. Must be rendered inside a <ChatProvider>
 * (see hooks/useChat.tsx) — it shares state with any <ChatPanel />
 * also on the page, so there is only ever one conversation.
 * ------------------------------------------------------------------
 */
export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { showWelcomeMessage } = useChat();

  useEffect(() => {
    if (isOpen) {
      showWelcomeMessage();
    }
  }, [isOpen, showWelcomeMessage]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      <AnimatePresence>{isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}</AnimatePresence>
      <ChatButton isOpen={isOpen} onClick={() => setIsOpen((prev) => !prev)} />
    </div>
  );
}

export default ChatbotWidget;
