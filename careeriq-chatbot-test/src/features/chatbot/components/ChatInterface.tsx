"use client";

import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import SuggestedQuestions from "./SuggestedQuestions";
import ChatInput from "./ChatInput";
import ChatError from "./ChatError";
import { useChat } from "../hooks/useChat";
import { CHATBOT_CONFIG } from "../utils/chatConfig";

interface ChatInterfaceProps {
  /** Show the close (X) button in the header — only relevant for the floating widget */
  onClose?: () => void;
}

/**
 * ChatInterface
 * ------------------------------------------------------------------
 * The actual chat experience: header, messages, suggestions, input.
 * Contains no positioning/sizing of its own — the parent (ChatPanel
 * for the embedded hero panel, ChatWindow for the floating widget)
 * controls width/height/placement via its wrapper. This keeps the
 * conversation logic and rendering in exactly one place.
 * ------------------------------------------------------------------
 */
export function ChatInterface({ onClose }: ChatInterfaceProps) {
  const { messages, isTyping, error, sendMessage } = useChat();
  const showSuggestions = messages.length <= 1 && !isTyping;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Blueprint grid overlay, local to the chat surface */}
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid opacity-60"
        aria-hidden="true"
      />

      <ChatHeader title={CHATBOT_CONFIG.botName} onClose={onClose} />

      <MessageList messages={messages} isTyping={isTyping} />

      {showSuggestions && (
        <SuggestedQuestions
          questions={CHATBOT_CONFIG.suggestedQuestions}
          onSelect={sendMessage}
          disabled={isTyping}
        />
      )}

      {error && <ChatError message={error} />}

      <div className="relative z-10">
        <ChatInput onSend={sendMessage} disabled={isTyping} />
      </div>
    </div>
  );
}

export default ChatInterface;
