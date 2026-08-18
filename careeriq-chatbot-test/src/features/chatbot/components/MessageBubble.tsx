"use client";

import { motion } from "framer-motion";
import { formatTime } from "../utils/formatTime";
import type { ChatMessage } from "../types/chat";

export function MessageBubble({ role, content, timestamp }: ChatMessage) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex max-w-[84%] flex-col ${isUser ? "self-end items-end" : "self-start items-start"}`}
    >
      <div
        className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
          isUser
            ? "rounded-tr-md bg-gradient-to-br from-accent to-accent/70 font-medium text-[#0c2233]"
            : "rounded-tl-md border border-accent/20 bg-white/5 text-white"
        }`}
      >
        {content}
      </div>
      <span className="mt-1 px-1 text-[10px] text-muted">{formatTime(timestamp)}</span>
    </motion.div>
  );
}

export default MessageBubble;
