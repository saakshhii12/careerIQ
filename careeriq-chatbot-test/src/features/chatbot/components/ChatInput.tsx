"use client";

import { useRef, useState, KeyboardEvent, ChangeEvent } from "react";
import { SendHorizontal } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter falls through and inserts a newline naturally
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 110)}px`;
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-accent/[0.18] bg-white/[0.02] p-3">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Ask about the platform..."
        aria-label="Message the assistant"
        className="min-h-[40px] max-h-[110px] flex-1 resize-none rounded-xl border border-accent/20 bg-white/[0.04] px-3 py-2.5 text-[13.5px] text-white placeholder:text-muted outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_rgba(100,210,200,0.15)] disabled:opacity-60"
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-accent/40 bg-accent/[0.12] text-accent transition hover:bg-accent/[0.22] hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-40"
      >
        <SendHorizontal size={17} />
      </button>
    </div>
  );
}

export default ChatInput;
