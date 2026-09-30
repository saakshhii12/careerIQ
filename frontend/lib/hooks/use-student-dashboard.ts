"use client";

import { useQuery } from "@tanstack/react-query";
import { getStudentDashboard } from "@/lib/api/student";
import { useAuth } from "@/providers/auth-provider";

export function useStudentDashboard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["student", "dashboard", user?.user_id],
    queryFn: getStudentDashboard,
    enabled: user?.role === "student",
  });
}
