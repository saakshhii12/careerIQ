import { StudentApplication } from "@/lib/types/application";
import { USE_MOCK_API, mockDelay } from "./config";
import { apiClient } from "./client";
import { MOCK_APPLICATIONS } from "./mock/applications";

export async function getMyApplications(): Promise<StudentApplication[]> {
  if (USE_MOCK_API) return mockDelay([...MOCK_APPLICATIONS]);
  return apiClient<StudentApplication[]>("/students/me/applications");
}

export async function getApplicationById(id: string): Promise<StudentApplication | undefined> {
  if (USE_MOCK_API) return mockDelay(MOCK_APPLICATIONS.find((a) => a.id === id));
  return apiClient<StudentApplication>(`/students/me/applications/${id}`);
}
