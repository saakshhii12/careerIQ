"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCandidates, getCandidateById, decideCandidate } from "@/lib/api/candidates";
import { Candidate } from "@/lib/types/candidate";

export function useCandidates() {
  return useQuery({
    queryKey: ["recruiter", "candidates"],
    queryFn: getCandidates,
  });
}

export function useCandidate(id: string) {
  return useQuery({
    queryKey: ["recruiter", "candidates", id],
    queryFn: () => getCandidateById(id),
  });
}

export function useDecideCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "shortlist" | "accept" | "reject" | "waitlist" }) =>
      decideCandidate(id, decision),
    onSuccess: (candidate) => {
      queryClient.setQueryData<Candidate[]>(["recruiter", "candidates"], (old) =>
        old?.map((c) => (c.id === candidate.id ? candidate : c))
      );
      queryClient.setQueryData(["recruiter", "candidates", candidate.id], candidate);
    },
  });
}
