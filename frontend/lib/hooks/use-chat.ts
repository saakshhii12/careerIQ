"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRecruiterInbox,
  getRecruiterThreads,
  sendMessageAsRecruiter,
  sendRecruiterMessage,
} from "@/lib/api/chat";
import { useAuth } from "@/providers/auth-provider";

/** Candidate-side recruiter conversations, including locked ones. */
export function useRecruiterThreads() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recruiter-threads", user?.user_id],
    queryFn: getRecruiterThreads,
    enabled: user?.role === "student",
  });
}

export function useSendRecruiterMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, text }: { applicationId: string; text: string }) =>
      sendRecruiterMessage(applicationId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter-threads"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/** Recruiter-side inbox — only shortlisted candidates appear here. */
export function useRecruiterInbox() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recruiter-inbox", user?.user_id],
    queryFn: getRecruiterInbox,
    enabled: user?.role === "recruiter",
  });
}

export function useSendMessageAsRecruiter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, text }: { applicationId: string; text: string }) =>
      sendMessageAsRecruiter(applicationId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter-inbox"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
