"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getConversations, sendMessage } from "@/lib/api/chat";
import { Conversation } from "@/lib/types/chat";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });
}

function appendOptimisticMessage(conversation: Conversation, text: string): Conversation {
  return {
    ...conversation,
    messages: [
      ...conversation.messages,
      { id: `local-${Date.now()}`, sender: "student", text, sentAt: new Date().toISOString() },
    ],
  };
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, text }: { conversationId: string; text: string }) =>
      sendMessage(conversationId, text),
    onMutate: ({ conversationId, text }) => {
      queryClient.setQueriesData<Conversation[]>({ queryKey: ["conversations"] }, (old) =>
        old?.map((c) => (c.id === conversationId ? appendOptimisticMessage(c, text) : c))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
