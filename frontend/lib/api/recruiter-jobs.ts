import { RecruiterJob, RecruiterJobInput } from "@/lib/types/recruiter-job";
import { USE_MOCK_API, mockDelay } from "./config";
import { apiClient } from "./client";
import { MOCK_RECRUITER_JOBS } from "./mock/recruiter-jobs";

export async function getRecruiterJobs(): Promise<RecruiterJob[]> {
  if (USE_MOCK_API) return mockDelay([...MOCK_RECRUITER_JOBS]);
  return apiClient<RecruiterJob[]>("/recruiters/me/jobs");
}

export async function getRecruiterJobById(id: string): Promise<RecruiterJob | undefined> {
  if (USE_MOCK_API) return mockDelay(MOCK_RECRUITER_JOBS.find((j) => j.id === id));
  return apiClient<RecruiterJob>(`/recruiters/me/jobs/${id}`);
}

export async function createRecruiterJob(input: RecruiterJobInput): Promise<RecruiterJob> {
  if (USE_MOCK_API) {
    const job: RecruiterJob = {
      ...input,
      id: `j${Date.now()}`,
      status: "open",
      applicantsCount: 0,
      newApplicantsCount: 0,
      postedAt: new Date().toISOString(),
    };
    MOCK_RECRUITER_JOBS.unshift(job);
    return mockDelay(job, 400);
  }
  return apiClient<RecruiterJob>("/recruiters/me/jobs", { method: "POST", body: input });
}

export async function updateRecruiterJob(id: string, input: RecruiterJobInput): Promise<RecruiterJob> {
  if (USE_MOCK_API) {
    const index = MOCK_RECRUITER_JOBS.findIndex((j) => j.id === id);
    if (index === -1) throw new Error("Job not found");
    MOCK_RECRUITER_JOBS[index] = { ...MOCK_RECRUITER_JOBS[index], ...input };
    return mockDelay(MOCK_RECRUITER_JOBS[index], 400);
  }
  return apiClient<RecruiterJob>(`/recruiters/me/jobs/${id}`, { method: "PATCH", body: input });
}

export async function setRecruiterJobStatus(id: string, status: RecruiterJob["status"]): Promise<RecruiterJob> {
  if (USE_MOCK_API) {
    const job = MOCK_RECRUITER_JOBS.find((j) => j.id === id);
    if (!job) throw new Error("Job not found");
    job.status = status;
    return mockDelay({ ...job }, 250);
  }
  return apiClient<RecruiterJob>(`/recruiters/me/jobs/${id}/status`, { method: "PATCH", body: { status } });
}

export async function deleteRecruiterJob(id: string): Promise<void> {
  if (USE_MOCK_API) {
    const index = MOCK_RECRUITER_JOBS.findIndex((j) => j.id === id);
    if (index !== -1) MOCK_RECRUITER_JOBS.splice(index, 1);
    return mockDelay(undefined, 250);
  }
  await apiClient(`/recruiters/me/jobs/${id}`, { method: "DELETE" });
}
