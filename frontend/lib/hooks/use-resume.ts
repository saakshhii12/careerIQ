"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getResumeStatus, uploadResume } from "@/lib/api/resume";

export function useResumeStatus() {
  return useQuery({
    queryKey: ["resume", "status"],
    queryFn: getResumeStatus,
  });
}

export function useUploadResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadResume(file),
    onSuccess: (data) => {
      queryClient.setQueryData(["resume", "status"], data);
    },
  });
}
