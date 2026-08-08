import { RecruiterDashboard } from "@/lib/types/recruiter";
import { USE_MOCK_API, mockDelay } from "./config";
import { apiClient } from "./client";
import { MOCK_RECRUITER_DASHBOARD } from "./mock/recruiter";

export async function getRecruiterDashboard(): Promise<RecruiterDashboard> {
  if (USE_MOCK_API) {
    return mockDelay(MOCK_RECRUITER_DASHBOARD);
  }
  return apiClient<RecruiterDashboard>("/recruiters/me/dashboard");
}
