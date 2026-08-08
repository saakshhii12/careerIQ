"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCompanyProfile, updateCompanyLogo, updateCompanyProfile } from "@/lib/api/company";

export function useCompanyProfile() {
  return useQuery({
    queryKey: ["company", "profile"],
    queryFn: getCompanyProfile,
  });
}

export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCompanyProfile,
    onSuccess: (data) => queryClient.setQueryData(["company", "profile"], data),
  });
}

export function useUpdateCompanyLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCompanyLogo,
    onSuccess: (data) => queryClient.setQueryData(["company", "profile"], data),
  });
}
