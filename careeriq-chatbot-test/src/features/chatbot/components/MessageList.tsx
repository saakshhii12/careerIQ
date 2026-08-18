"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import type { ChatMessage } from "../types/chat";

interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

export function MessageList({ messages, isTyping }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  return (
    <div
      className="scrollbar-thin relative z-10 flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
      role="log"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {messages.map((m) => (
          <MessageBubble key={m.id} id={m.id} role={m.role} content={m.content} timestamp={m.timestamp} />
        ))}
        {isTyping && <TypingIndicator key="typing" />}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
