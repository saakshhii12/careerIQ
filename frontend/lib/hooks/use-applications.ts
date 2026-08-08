"use client";

import { useQuery } from "@tanstack/react-query";
import { getApplicationById, getMyApplications } from "@/lib/api/applications";

export function useMyApplications() {
  return useQuery({
    queryKey: ["applications", "mine"],
    queryFn: getMyApplications,
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: ["applications", "mine", id],
    queryFn: () => getApplicationById(id),
  });
}
