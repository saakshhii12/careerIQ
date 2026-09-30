"use client";

import { useState } from "react";
import { AlertTriangle, MessageSquare, Send } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRecruiterInbox, useSendMessageAsRecruiter } from "@/lib/hooks/use-chat";

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function RecruiterMessagesPage() {
  const { data: threads, isLoading, isError, error } = useRecruiterInbox();
  const sendMutation = useSendMessageAsRecruiter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const active = threads?.find((t) => t.id === activeId) ?? threads?.[0] ?? null;

  function handleSend() {
    const text = draft.trim();
    if (!text || !active) return;
    sendMutation.reset();
    sendMutation.mutate({ applicationId: active.applicationId, text });
    setDraft("");
  }

  const sendError = sendMutation.error instanceof Error ? sendMutation.error.message : null;

  return (
    <>
      <Topbar
        title="Candidate Messages"
        subtitle="Direct conversations with candidates you have shortlisted"
      />
      <div className="flex flex-1 flex-col gap-4 p-6 lg:flex-row lg:gap-6">
        <GlassCard className="!p-0 w-full shrink-0 overflow-hidden lg:w-72">
          {isLoading && (
            <div className="flex flex-col gap-2 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-md bg-[var(--color-bg-elevated)]" />
              ))}
            </div>
          )}
          {!isLoading && (!threads || threads.length === 0) && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <MessageSquare size={24} className="text-[var(--color-text-faint)]" />
              <p className="text-sm text-[var(--color-text-muted)]">
                No conversations yet. A thread opens once you shortlist a candidate.
              </p>
            </div>
          )}
          {threads && threads.length > 0 && (
            <div className="flex max-h-[70vh] flex-col overflow-y-auto">
              {threads.map((thread) => {
                const lastMessage = thread.messages[thread.messages.length - 1];
                return (
                  <button
                    key={thread.id}
                    onClick={() => setActiveId(thread.id)}
                    className={cn(
                      "flex flex-col gap-1 border-b border-[var(--color-border)] px-4 py-3.5 text-left transition-colors",
                      active?.id === thread.id
                        ? "bg-[var(--color-accent-soft)]"
                        : "hover:bg-[var(--color-bg-muted)]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-[var(--color-text)]">
                        {thread.candidateName}
                      </span>
                      {(thread.unreadCount ?? 0) > 0 && (
                        <span className="rounded-full bg-[var(--color-accent)] px-1.5 text-[10px] font-medium text-white">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="truncate text-xs text-[var(--color-text-faint)]">
                      {thread.jobTitle}
                    </span>
                    {lastMessage ? (
                      <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                        {lastMessage.text}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-[var(--color-text-faint)]">No messages yet</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard className="!p-0 flex min-h-[28rem] flex-1 flex-col overflow-hidden">
          {isError && (
            <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-[var(--color-danger)]">
              {error instanceof Error ? error.message : "Couldn't load your messages."}
            </div>
          )}

          {!isError && !active && !isLoading && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <MessageSquare size={28} className="text-[var(--color-text-faint)]" />
              <p className="text-sm text-[var(--color-text-muted)]">
                Select a conversation to view messages.
              </p>
            </div>
          )}

          {active && (
            <div className="flex flex-1 flex-col">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-6 py-4">
                <div>
                  <h3 className="text-sm font-medium text-[var(--color-text)]">
                    {active.candidateName}
                  </h3>
                  <p className="text-xs text-[var(--color-text-faint)]">
                    {active.jobTitle} · {active.company}
                  </p>
                </div>
                <Badge tone="success">{active.applicationStatus}</Badge>
              </div>

              <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
                {active.messages.length === 0 && (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Start the conversation — {active.candidateName.split(" ")[0]} has been shortlisted
                    for this role.
                  </p>
                )}
                {active.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.sender === "recruiter" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-md rounded-[var(--radius-card)] px-4 py-2.5 text-sm leading-relaxed",
                        message.sender === "recruiter"
                          ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                          : "border border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text)]"
                      )}
                    >
                      <p>{message.text}</p>
                      <span
                        className={cn(
                          "mt-1 block text-[11px]",
                          message.sender === "recruiter"
                            ? "text-[var(--color-accent-foreground)]/70"
                            : "text-[var(--color-text-faint)]"
                        )}
                      >
                        {timeLabel(message.sentAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {sendError && (
                <div className="flex items-start gap-2 border-t border-[var(--color-border)] bg-[var(--color-danger-soft)] px-6 py-3 text-sm text-[var(--color-danger)]">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  {sendError}
                </div>
              )}

              <div className="flex items-center gap-3 border-t border-[var(--color-border)] px-6 py-4">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message…"
                  className="h-10 flex-1 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                />
                <Button size="md" onClick={handleSend} disabled={sendMutation.isPending || !draft.trim()}>
                  <Send size={15} />
                </Button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </>
  );
}
