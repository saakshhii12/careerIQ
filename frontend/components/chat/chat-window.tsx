"use client";

import { useState } from "react";
import { Send, Bot, Lock, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { Conversation } from "@/lib/types/chat";
import { Button } from "@/components/ui/button";

export function ChatWindow({
  conversation,
  onSend,
  sending,
}: {
  conversation: Conversation | null;
  onSend: (text: string) => void;
  sending?: boolean;
}) {
  const [draft, setDraft] = useState("");

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <Bot size={28} className="text-[var(--color-text-faint)]" />
        <p className="text-sm text-[var(--color-text-muted)]">Select a conversation to view messages.</p>
      </div>
    );
  }

  if (!conversation.unlocked) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] text-[var(--color-text-faint)]">
          <Lock size={20} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">Chat unlocks after acceptance</h3>
          <p className="mt-1 max-w-xs text-sm text-[var(--color-text-muted)]">
            You&apos;ll be able to message {conversation.company} once they accept your application for{" "}
            {conversation.jobTitle}.
          </p>
        </div>
      </div>
    );
  }

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-white/[0.06] px-6 py-4">
        <h3 className="text-sm font-medium text-white">{conversation.company}</h3>
        <p className="text-xs text-[var(--color-text-faint)]">{conversation.jobTitle}</p>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
        {conversation.messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.sender === "student" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-md rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.sender === "student"
                  ? "bg-[var(--color-accent)] text-[#0b1424]"
                  : "glass text-[var(--color-text-muted)]"
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-white/[0.06] px-6 py-4">
        <button
          type="button"
          aria-label="Attach file"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[var(--color-text-muted)] transition-colors hover:text-white"
        >
          <Paperclip size={16} />
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message…"
          className="h-11 flex-1 rounded-full bg-white/[0.04] border border-white/10 px-4 text-sm text-white placeholder:text-[var(--color-text-faint)] outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
        />
        <Button size="sm" onClick={handleSend} disabled={sending || !draft.trim()}>
          <Send size={15} />
        </Button>
      </div>
    </div>
  );
}
