import { RecruiterAnalytics } from "@/lib/types/analytics";
import { apiClient } from "./client";

export async function getRecruiterAnalytics(): Promise<RecruiterAnalytics> {
  return apiClient<RecruiterAnalytics>("/recruiters/me/analytics");
}
