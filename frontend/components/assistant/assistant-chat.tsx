"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, FileText, RotateCcw, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AssistantContext, AssistantMessage } from "@/lib/types/assistant";

const SUGGESTIONS = [
  "Review my resume and suggest what I should improve.",
  "Which of my skills are strongest for the roles I've applied to?",
  "What should I study before my next interview?",
  "How do I explain my projects in an interview?",
];

export function AssistantChat({
  messages,
  context,
  onSend,
  onReset,
  sending,
  resetting,
  loading,
  errorMessage,
}: {
  messages: AssistantMessage[];
  context?: AssistantContext;
  onSend: (text: string) => void;
  onReset: () => void;
  sending?: boolean;
  resetting?: boolean;
  loading?: boolean;
  errorMessage?: string | null;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () => messages.filter((message) => message.role !== "system"),
    [messages]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visible.length, sending]);

  function submit(text: string) {
    const value = text.trim();
    if (!value || sending) return;
    onSend(value);
    setDraft("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {context && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-6 py-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            Answering for <span className="font-medium text-[var(--color-text)]">{context.candidateName}</span> using
            your profile
            {context.hasResume ? (
              <>
                , resume{context.resumeName ? ` (${context.resumeName})` : ""}
              </>
            ) : null}
            {context.applicationCount > 0
              ? `, and ${context.applicationCount} application${context.applicationCount === 1 ? "" : "s"}`
              : ""}
            .
          </p>
          {visible.length > 0 && (
            <button
              type="button"
              onClick={onReset}
              disabled={resetting}
              className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-text)] disabled:opacity-40"
            >
              <RotateCcw size={12} /> Clear conversation
            </button>
          )}
        </div>
      )}

      {context && !context.hasResume && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-warning-soft)] px-6 py-3 text-sm text-[var(--color-warning)]">
          <FileText size={15} />
          Upload your resume so the assistant can review it.
          <Link href="/student/resume" className="font-medium underline">
            Upload resume
          </Link>
        </div>
      )}

      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
        {loading && (
          <div className="flex flex-col gap-3">
            {[0, 1].map((index) => (
              <div key={index} className="h-16 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-bg-elevated)]" />
            ))}
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Sparkles size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text)]">
                Ask about your career, resume, or applications
              </h3>
              <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
                The assistant already has your profile and resume on file. You don&apos;t need to upload
                anything again.
              </p>
            </div>
            <div className="flex max-w-lg flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => submit(suggestion)}
                  className="rounded-full border border-[var(--color-border)] px-3.5 py-1.5 text-xs text-[var(--color-text-muted)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {visible.map((message) => (
          <div
            key={message.id}
            className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-xl whitespace-pre-wrap rounded-[var(--radius-card)] px-4 py-3 text-sm leading-relaxed",
                message.role === "user"
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                  : "border border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text)]"
              )}
            >
              {message.text}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-text-faint)]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-text-faint)] [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-text-faint)] [animation-delay:300ms]" />
              </span>
              Thinking
            </div>
          </div>
        )}
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
          submit(draft);
        }}
        className="flex items-end gap-3 border-t border-[var(--color-border)] px-6 py-4"
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit(draft);
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Ask about your resume, skills, applications, or interview prep…"
          className="max-h-32 min-h-10 flex-1 resize-y rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
        />
        <Button type="submit" disabled={sending || !draft.trim()}>
          <Send size={15} /> Send
        </Button>
      </form>
    </div>
  );
}
