"use client";

import { useQuery } from "@tanstack/react-query";
import { getRecruiterDashboard } from "@/lib/api/recruiter";

export function useRecruiterDashboard() {
  return useQuery({
    queryKey: ["recruiter", "dashboard"],
    queryFn: getRecruiterDashboard,
  });
}
