"use client";

import { useQuery } from "@tanstack/react-query";
import { getRecruiterAnalytics } from "@/lib/api/analytics";

export function useRecruiterAnalytics() {
  return useQuery({
    queryKey: ["recruiter", "analytics"],
    queryFn: getRecruiterAnalytics,
  });
}
