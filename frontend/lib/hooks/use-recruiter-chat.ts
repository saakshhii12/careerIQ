"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRecruiterConversations, sendRecruiterMessage } from "@/lib/api/recruiter-chat";
import { RecruiterConversation } from "@/lib/types/recruiter-chat";

export function useRecruiterConversations() {
  return useQuery({
    queryKey: ["recruiter", "conversations"],
    queryFn: getRecruiterConversations,
  });
}

export function useSendRecruiterMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, text }: { conversationId: string; text: string }) =>
      sendRecruiterMessage(conversationId, text),
    onMutate: ({ conversationId, text }) => {
      queryClient.setQueryData<RecruiterConversation[]>(["recruiter", "conversations"], (old) =>
        old?.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { id: `local-${Date.now()}`, sender: "recruiter", text, sentAt: new Date().toISOString() },
                ],
              }
            : c
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter", "conversations"] });
    },
  });
}
