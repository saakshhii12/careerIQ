import { RecruiterJob, RecruiterJobInput } from "@/lib/types/recruiter-job";
import { apiClient } from "./client";

export async function getRecruiterJobs(): Promise<RecruiterJob[]> {
  return apiClient<RecruiterJob[]>("/recruiters/me/jobs");
}

export async function getRecruiterJobById(id: string): Promise<RecruiterJob | undefined> {
  return apiClient<RecruiterJob>(`/recruiters/me/jobs/${id}`);
}

export async function createRecruiterJob(input: RecruiterJobInput): Promise<RecruiterJob> {
  return apiClient<RecruiterJob>("/recruiters/me/jobs", { method: "POST", body: input });
}

export async function updateRecruiterJob(id: string, input: RecruiterJobInput): Promise<RecruiterJob> {
  return apiClient<RecruiterJob>(`/recruiters/me/jobs/${id}`, { method: "PATCH", body: input });
}

export async function setRecruiterJobStatus(id: string, status: RecruiterJob["status"]): Promise<RecruiterJob> {
  return apiClient<RecruiterJob>(`/recruiters/me/jobs/${id}/status`, { method: "PATCH", body: { status } });
}

export async function deleteRecruiterJob(id: string): Promise<void> {
  await apiClient(`/recruiters/me/jobs/${id}`, { method: "DELETE" });
}
