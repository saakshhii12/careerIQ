"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile, updateProfilePhoto } from "@/lib/api/profile";
import { useAuth } from "@/providers/auth-provider";

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.user_id],
    queryFn: getProfile,
    enabled: Boolean(user?.user_id),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(["profile", user?.user_id], data);
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
    },
  });
}

export function useUpdateProfilePhoto() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (file: File) => updateProfilePhoto(file),
    onSuccess: (data) => {
      queryClient.setQueryData(["profile", user?.user_id], data);
    },
  });
}
