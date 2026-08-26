import { RecruiterAnalytics } from "@/lib/types/analytics";
import { USE_MOCK_API, mockDelay } from "./config";
import { apiClient } from "./client";
import { MOCK_RECRUITER_ANALYTICS } from "./mock/analytics";

export async function getRecruiterAnalytics(): Promise<RecruiterAnalytics> {
  if (USE_MOCK_API) return mockDelay(MOCK_RECRUITER_ANALYTICS);
  return apiClient<RecruiterAnalytics>("/recruiters/me/analytics");
}
