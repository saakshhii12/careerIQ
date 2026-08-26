"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applyToJob, getJobs } from "@/lib/api/jobs";

export function useJobs() {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: getJobs,
  });
}

export function useApplyToJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => applyToJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
