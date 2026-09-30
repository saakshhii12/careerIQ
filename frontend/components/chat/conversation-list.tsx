"use client";

import { Lock, MessageSquare, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecruiterThread } from "@/lib/types/chat";

export function ConversationList({
  threads,
  activeId,
  onSelect,
}: {
  threads: RecruiterThread[];
  activeId?: string;
  onSelect: (thread: RecruiterThread) => void;
}) {
  if (threads.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <MessageSquare size={22} className="text-[var(--color-text-faint)]" />
        <p className="text-sm text-[var(--color-text-muted)]">
          Apply to a role to start tracking recruiter conversations.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {threads.map((thread) => {
        const lastMessage = thread.messages[thread.messages.length - 1];
        const active = activeId === thread.id;
        return (
          <button
            key={thread.id}
            type="button"
            onClick={() => onSelect(thread)}
            className={cn(
              "flex flex-col gap-1 border-b border-[var(--color-border)] px-4 py-3.5 text-left transition-colors last:border-0",
              active ? "bg-[var(--color-accent-soft)]" : "hover:bg-[var(--color-bg-muted)]"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-[var(--color-text)]">{thread.company}</span>
              {thread.unlocked ? (
                <Unlock size={13} className="shrink-0 text-[var(--color-success)]" />
              ) : (
                <Lock size={13} className="shrink-0 text-[var(--color-text-faint)]" />
              )}
            </div>
            <span className="truncate text-xs text-[var(--color-text-faint)]">{thread.jobTitle}</span>
            <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
              {thread.applicationStatus === "Rejected"
                ? "Rejected"
                : thread.unlocked
                  ? (lastMessage?.text ?? "No messages yet — say hello")
                  : `Locked · ${thread.applicationStatus}`}
            </p>
          </button>
        );
      })}
    </div>
  );
}
