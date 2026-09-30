"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearAssistantConversation,
  getAssistantConversation,
  sendAssistantMessage,
} from "@/lib/api/assistant";
import { AssistantConversation } from "@/lib/types/assistant";
import { useAuth } from "@/providers/auth-provider";

export function useAssistantConversation() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["assistant", "conversation", user?.user_id],
    queryFn: getAssistantConversation,
    enabled: user?.role === "student",
  });
}

export function useSendAssistantMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const queryKey = ["assistant", "conversation", user?.user_id];

  return useMutation({
    mutationFn: (message: string) => sendAssistantMessage(message),
    // Show the candidate's own message immediately; the reply arrives with the
    // response. On failure the optimistic message is rolled back so the input
    // is not silently lost from view.
    onMutate: async (message) => {
      const previous = queryClient.getQueryData<AssistantConversation>(queryKey);
      queryClient.setQueryData<AssistantConversation>(queryKey, (old) =>
        old
          ? {
              ...old,
              messages: [
                ...old.messages,
                {
                  id: `pending-${Date.now()}`,
                  role: "user" as const,
                  text: message,
                  sentAt: new Date().toISOString(),
                },
              ],
            }
          : old
      );
      return { previous };
    },
    onError: (_error, _message, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSuccess: (data) => {
      queryClient.setQueryData<AssistantConversation>(queryKey, (old) =>
        old
          ? {
              ...old,
              messages: [
                ...old.messages.filter((item) => !item.id.startsWith("pending-")),
                data.userMessage,
                data.reply,
              ],
            }
          : old
      );
    },
  });
}

export function useClearAssistantConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearAssistantConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistant"] });
    },
  });
}
