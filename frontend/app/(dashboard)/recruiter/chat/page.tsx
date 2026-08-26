"use client";

import { useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRecruiterConversations, useSendRecruiterMessage } from "@/lib/hooks/use-recruiter-chat";

export default function RecruiterChatPage() {
  const { data: conversations } = useRecruiterConversations();
  const sendMutation = useSendRecruiterMessage();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const active = conversations?.find((c) => c.id === activeId) ?? conversations?.[0] ?? null;

  function handleSend() {
    const text = draft.trim();
    if (!text || !active) return;
    sendMutation.mutate({ conversationId: active.id, text });
    setDraft("");
  }

  return (
    <>
      <Topbar title="Chat" subtitle="Conversations with accepted candidates" />
      <div className="flex flex-1 gap-6 p-8">
        <GlassCard className="!p-0 w-72 shrink-0 overflow-hidden">
          {!conversations || conversations.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <MessageCircle size={24} className="text-[var(--color-text-faint)]" />
              <p className="text-sm text-[var(--color-text-muted)]">
                No conversations yet. Chats open once you accept a candidate.
              </p>
            </div>
          ) : (
            <div className="flex flex-col overflow-y-auto">
              {conversations.map((c) => {
                const lastMessage = c.messages[c.messages.length - 1];
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      "flex flex-col gap-1 border-b border-white/[0.05] px-4 py-3.5 text-left transition-colors",
                      active?.id === c.id ? "bg-[var(--color-accent)]/8" : "hover:bg-white/[0.03]"
                    )}
                  >
                    <span className="truncate text-sm font-medium text-white">{c.candidateName}</span>
                    <span className="truncate text-xs text-[var(--color-text-faint)]">{c.jobTitle}</span>
                    {lastMessage && (
                      <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">{lastMessage.text}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard className="!p-0 flex flex-1 flex-col overflow-hidden">
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <MessageCircle size={28} className="text-[var(--color-text-faint)]" />
              <p className="text-sm text-[var(--color-text-muted)]">Select a conversation to view messages.</p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col">
              <div className="border-b border-white/[0.06] px-6 py-4">
                <h3 className="text-sm font-medium text-white">{active.candidateName}</h3>
                <p className="text-xs text-[var(--color-text-faint)]">{active.jobTitle}</p>
              </div>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
                {active.messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.sender === "recruiter" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-md rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        m.sender === "recruiter"
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
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message…"
                  className="h-11 flex-1 rounded-full bg-white/[0.04] border border-white/10 px-4 text-sm text-white placeholder:text-[var(--color-text-faint)] outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
                />
                <Button size="sm" onClick={handleSend} disabled={sendMutation.isPending || !draft.trim()}>
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
