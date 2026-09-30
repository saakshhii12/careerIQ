"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Lock, MessageSquare, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecruiterThread } from "@/lib/types/chat";
import { Button } from "@/components/ui/button";

export function ChatWindow({
  thread,
  onSend,
  sending,
  errorMessage,
}: {
  thread: RecruiterThread | null;
  onSend: (text: string) => void;
  sending?: boolean;
  errorMessage?: string | null;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread?.id, thread?.messages.length]);

  if (!thread) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
        <MessageSquare size={24} className="text-[var(--color-text-faint)]" />
        <p className="text-sm text-[var(--color-text-muted)]">
          Select an application to see its recruiter conversation.
        </p>
      </div>
    );
  }

  if (!thread.unlocked) {
    if (thread.applicationStatus === "Rejected") {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <h3 className="text-base font-semibold text-[var(--color-text)]">Rejected</h3>
        </div>
      );
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-muted)] text-[var(--color-text-faint)]">
          <Lock size={20} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[var(--color-text)]">Recruiter chat is locked</h3>
          <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
            {thread.lockedReason ??
              "Recruiter communication unlocks after you pass the AI interview (60% or higher)."}
          </p>
        </div>
        <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-4 py-3 text-left">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
            {thread.jobTitle} · {thread.company}
          </p>
          <p className="mt-1.5 text-sm text-[var(--color-text)]">
            Current status: {thread.applicationStatus}
          </p>
          {thread.nextStep && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{thread.nextStep}</p>
          )}
        </div>
      </div>
    );
  }

  function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;
    onSend(text);
    setDraft("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-[var(--color-border)] px-6 py-4">
        <h3 className="text-sm font-medium text-[var(--color-text)]">{thread.company}</h3>
        <p className="text-xs text-[var(--color-text-faint)]">
          {thread.jobTitle}
          {thread.recruiterName ? ` · ${thread.recruiterName}` : ""} · {thread.applicationStatus}
        </p>
      </div>

      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
        {thread.messages.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
            You&apos;ve been shortlisted after passing the interview. Send the first message to start the conversation.
          </p>
        )}
        {thread.messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex", message.sender === "student" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-md whitespace-pre-wrap rounded-[var(--radius-card)] px-4 py-2.5 text-sm leading-relaxed",
                message.sender === "student"
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                  : "border border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text)]"
              )}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 border-t border-[var(--color-danger)]/25 bg-[var(--color-danger-soft)] px-6 py-3 text-sm text-[var(--color-danger)]">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-3 border-t border-[var(--color-border)] px-6 py-4"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={2000}
          placeholder="Write a message to the recruiter…"
          className="h-10 flex-1 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
        />
        <Button type="submit" size="sm" disabled={sending || !draft.trim()}>
          <Send size={15} />
        </Button>
      </form>
    </div>
  );
}
