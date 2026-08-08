"use client";

import { useQuery } from "@tanstack/react-query";
import { getStudentDashboard } from "@/lib/api/student";

export function useStudentDashboard() {
  return useQuery({
    queryKey: ["student", "dashboard"],
    queryFn: getStudentDashboard,
  });
}
