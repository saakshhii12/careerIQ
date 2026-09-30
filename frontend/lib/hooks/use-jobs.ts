"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applyToJob, getJobs } from "@/lib/api/jobs";
import { useAuth } from "@/providers/auth-provider";

export function useJobs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["jobs", user?.user_id],
    queryFn: getJobs,
    enabled: user?.role === "student",
  });
}

export function useApplyToJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => applyToJob(jobId),
    // Refetch rather than patching local state: Supabase is the source of
    // truth, so the "Applied" badge must come from a fresh read.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["recruiter-threads"] });
    },
    onError: (error) => {
      // Keep a diagnostic trail; the UI renders mutation.error itself.
      console.error("Job application failed:", error);
    },
  });
}
