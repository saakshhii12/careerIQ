"use client";

import { MessageCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Conversation } from "@/lib/types/chat";

export function ConversationList({
  conversations,
  activeId,
  onSelect,
}: {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (conversation: Conversation) => void;
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <MessageCircle size={24} className="text-[var(--color-text-faint)]" />
        <p className="text-sm text-[var(--color-text-muted)]">
          No conversations yet. Chats unlock once a recruiter accepts your application.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {conversations.map((c) => {
        const lastMessage = c.messages[c.messages.length - 1];
        return (
          <button
            key={c.id}
            onClick={() => c.unlocked && onSelect(c)}
            disabled={!c.unlocked}
            className={cn(
              "flex flex-col gap-1 border-b border-white/[0.05] px-4 py-3.5 text-left transition-colors",
              !c.unlocked && "cursor-not-allowed opacity-50",
              c.unlocked && activeId === c.id ? "bg-[var(--color-accent)]/8" : c.unlocked && "hover:bg-white/[0.03]"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-white">{c.company}</span>
              {!c.unlocked && <Lock size={13} className="shrink-0 text-[var(--color-text-faint)]" />}
            </div>
            <span className="truncate text-xs text-[var(--color-text-faint)]">{c.jobTitle}</span>
            <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
              {c.unlocked ? lastMessage?.text ?? "No messages yet" : "Chat unlocks after acceptance"}
            </p>
          </button>
        );
      })}
    </div>
  );
}
