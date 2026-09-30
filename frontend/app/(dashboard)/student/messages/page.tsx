"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, MessageSquare, Sparkles } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { ConversationList } from "@/components/chat/conversation-list";
import { ChatWindow } from "@/components/chat/chat-window";
import { useRecruiterThreads, useSendRecruiterMessage } from "@/lib/hooks/use-chat";

/**
 * Recruiter Messages — direct communication with a recruiter, unlocked after a
 * passing AI interview shortlists the candidate for that application.
 *
 * The AI Career Assistant is a separate feature at /student/chat.
 */
export default function RecruiterMessagesPage() {
  const { data, isLoading, isError, error } = useRecruiterThreads();
  const sendMutation = useSendRecruiterMessage();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const threads = data?.threads ?? [];
  const unlockedCount = data?.unlockedCount ?? 0;
  const activeId = selectedId ?? threads.find((thread) => thread.unlocked)?.id ?? threads[0]?.id;
  const active = threads.find((thread) => thread.id === activeId) ?? null;

  return (
    <>
      <Topbar
        title="Recruiter Messages"
        subtitle={
          unlockedCount > 0
            ? `${unlockedCount} conversation${unlockedCount === 1 ? "" : "s"} available`
            : "Opens after you pass the AI interview"
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        {unlockedCount === 0 && !isLoading && threads.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
            <Lock size={15} />
            Recruiter communication is locked until you pass the AI interview (60% or higher).
            <Link href="/student/chat" className="ml-auto flex items-center gap-1.5 font-medium text-[var(--color-accent-dim)] hover:underline">
              <Sparkles size={13} /> Ask the Career Assistant instead
            </Link>
          </div>
        )}

        {isError && (
          <div className="text-sm text-[var(--color-danger)]">
            {error instanceof Error ? error.message : "Couldn't load recruiter messages."}
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
            <div className="h-72 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-bg-elevated)]" />
            <div className="h-72 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-bg-elevated)]" />
          </div>
        )}

        {!isLoading && threads.length === 0 && !isError && (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <MessageSquare size={26} className="text-[var(--color-text-faint)]" />
            <p className="text-sm text-[var(--color-text-muted)]">
              You haven&apos;t applied to any roles yet.
            </p>
            <Link href="/student/applications" className="text-sm font-medium text-[var(--color-accent-dim)] hover:underline">
              Browse jobs
            </Link>
          </div>
        )}

        {!isLoading && threads.length > 0 && (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
            <GlassCard className="!p-0 min-h-0 overflow-hidden">
              <ConversationList
                threads={threads}
                activeId={active?.id}
                onSelect={(thread) => setSelectedId(thread.id)}
              />
            </GlassCard>
            <GlassCard className="!p-0 flex min-h-[28rem] flex-col overflow-hidden">
              <ChatWindow
                thread={active}
                sending={sendMutation.isPending}
                errorMessage={
                  sendMutation.error instanceof Error ? sendMutation.error.message : null
                }
                onSend={(text) => {
                  if (!active) return;
                  sendMutation.mutate({ applicationId: active.applicationId, text });
                }}
              />
            </GlassCard>
          </div>
        )}
      </div>
    </>
  );
}
