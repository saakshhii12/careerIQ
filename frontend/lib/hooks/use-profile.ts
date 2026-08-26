"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfilePhoto } from "@/lib/api/profile";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });
}

export function useUpdateProfilePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => updateProfilePhoto(file),
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data);
    },
  });
}
