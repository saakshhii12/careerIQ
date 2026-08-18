"use client";

import { createContext, useCallback, useContext, useRef, useState, ReactNode } from "react";
import { sendChatMessage, ChatClientError } from "../services/chatClient";
import { CHATBOT_CONFIG } from "../utils/chatConfig";
import { generateId } from "../utils/generateId";
import type { ChatMessage, ChatRole } from "../types/chat";

interface ChatContextValue {
  messages: ChatMessage[];
  isTyping: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  showWelcomeMessage: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const makeMessage = (role: ChatRole, content: string): ChatMessage => ({
  id: generateId(),
  role,
  content,
  timestamp: new Date().toISOString(),
});

/**
 * ChatProvider
 * ------------------------------------------------------------------
 * Single source of truth for the conversation. Both the embedded
 * hero panel and the floating widget read from this context, so a
 * message sent in one shows up in the other — there's only ever one
 * conversation on the page.
 * ------------------------------------------------------------------
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasWelcomed = useRef(false);

  const showWelcomeMessage = useCallback(() => {
    if (hasWelcomed.current) return;
    hasWelcomed.current = true;
    setMessages([makeMessage("assistant", CHATBOT_CONFIG.welcomeMessage)]);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMessage = makeMessage("user", trimmed);
      setError(null);
      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      try {
        const historyForApi = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const reply = await sendChatMessage(historyForApi);
        setMessages((prev) => [...prev, makeMessage("assistant", reply)]);
      } catch (err) {
        const friendly =
          err instanceof ChatClientError
            ? err.message
            : "Something went wrong. Please try again in a moment.";
        setError(friendly);
        setMessages((prev) => [
          ...prev,
          makeMessage(
            "assistant",
            "Sorry, I ran into an issue answering that. Please try again, or contact support if this keeps happening."
          ),
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages, isTyping]
  );

  return (
    <ChatContext.Provider value={{ messages, isTyping, error, sendMessage, showWelcomeMessage }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within a <ChatProvider>");
  }
  return ctx;
}

export default ChatProvider;
