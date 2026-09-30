"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRecruiterSettings, updateRecruiterSettings } from "@/lib/api/recruiter";

export function useRecruiterSettings() {
  return useQuery({
    queryKey: ["recruiter", "settings"],
    queryFn: getRecruiterSettings,
  });
}

export function useUpdateRecruiterSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRecruiterSettings,
    onSuccess: (data) => queryClient.setQueryData(["recruiter", "settings"], data),
  });
}
