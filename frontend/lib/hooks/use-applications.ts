"use client";

import { useQuery } from "@tanstack/react-query";
import { getApplicationById, getMyApplications } from "@/lib/api/applications";
import { useAuth } from "@/providers/auth-provider";

export function useMyApplications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["applications", "mine", user?.user_id],
    queryFn: getMyApplications,
    enabled: user?.role === "student",
  });
}

export function useApplication(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["applications", "mine", user?.user_id, id],
    queryFn: () => getApplicationById(id),
    enabled: Boolean(user?.user_id && id),
  });
}
