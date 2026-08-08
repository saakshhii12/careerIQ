import { StudentDashboard } from "@/lib/types/student";
import { USE_MOCK_API, mockDelay } from "./config";
import { apiClient } from "./client";
import { MOCK_STUDENT_DASHBOARD } from "./mock/student";

export async function getStudentDashboard(): Promise<StudentDashboard> {
  if (USE_MOCK_API) {
    return mockDelay(MOCK_STUDENT_DASHBOARD);
  }
  return apiClient<StudentDashboard>("/students/me/dashboard");
}
