"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getResumeStatus, uploadResume } from "@/lib/api/resume";
import { useAuth } from "@/providers/auth-provider";

export function useResumeStatus() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["resume", "status", user?.user_id],
    queryFn: getResumeStatus,
    enabled: user?.role === "student",
  });
}

export function useUploadResume() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (file: File) => uploadResume(file),
    onSuccess: (data) => {
      queryClient.setQueryData(["resume", "status", user?.user_id], data);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] });
    },
  });
}
