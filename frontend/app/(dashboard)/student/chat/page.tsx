"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { ConversationList } from "@/components/chat/conversation-list";
import { ChatWindow } from "@/components/chat/chat-window";
import { useConversations, useSendMessage } from "@/lib/hooks/use-chat";

export default function ChatPage() {
  const { data: conversations } = useConversations();
  const sendMutation = useSendMessage();

  const [manualActiveId, setManualActiveId] = useState<string | null>(null);

  const firstUnlockedId = conversations?.find((c) => c.unlocked)?.id ?? null;
  const activeId = manualActiveId ?? firstUnlockedId;
  const active = conversations?.find((c) => c.id === activeId) ?? null;

  return (
    <>
      <Topbar title="Chat" subtitle="Unlocks once a recruiter accepts your application" />
      <div className="flex flex-1 gap-6 p-8">
        <GlassCard className="!p-0 w-72 shrink-0 overflow-hidden">
          <ConversationList
            conversations={conversations ?? []}
            activeId={active?.id}
            onSelect={(c) => setManualActiveId(c.id)}
          />
        </GlassCard>
        <GlassCard className="!p-0 flex flex-1 flex-col overflow-hidden">
          <ChatWindow
            conversation={active}
            sending={sendMutation.isPending}
            onSend={(text) => {
              if (!active) return;
              sendMutation.mutate({ conversationId: active.id, text });
            }}
          />
        </GlassCard>
      </div>
    </>
  );
}
