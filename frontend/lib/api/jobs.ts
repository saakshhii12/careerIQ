import { Job } from "@/lib/types/job";
import { USE_MOCK_API, mockDelay } from "./config";
import { apiClient } from "./client";
import { MOCK_JOBS } from "./mock/jobs";

export async function getJobs(): Promise<Job[]> {
  if (USE_MOCK_API) {
    return mockDelay(MOCK_JOBS);
  }
  return apiClient<Job[]>("/jobs");
}

export async function applyToJob(jobId: string): Promise<{ success: true }> {
  if (USE_MOCK_API) {
    const job = MOCK_JOBS.find((j) => j.id === jobId);
    if (job) job.applied = true;
    return mockDelay({ success: true as const }, 500);
  }
  return apiClient(`/jobs/${jobId}/apply`, { method: "POST" });
}
