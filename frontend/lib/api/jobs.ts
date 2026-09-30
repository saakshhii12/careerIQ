import { Job, ApplicationStage } from "@/lib/types/job";
import { BACKEND_URL, getToken } from "./config";

interface BackendJobRow {
  job_id: number;
  job_title: string;
  company_name: string;
  description: string;
  location: string | null;
  experience_required: number | null;
  salary_min: number | null;
  salary_max: number | null;
  created_at: string;
  employment_type?: string | null;
  work_mode?: string | null;
  deadline?: string | null;
  applicants_count?: number | null;
  application: {
    application_id: number;
    match_score: number | null;
    quiz_passed: boolean | null;
    quiz_status: string | null;
  } | null;
  previewMatch: {
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
  } | null;
}

function mapJobStage(application: BackendJobRow["application"]): ApplicationStage | undefined {
  if (!application) return undefined;
  if (application.quiz_passed) return "interview";
  if (application.quiz_status === "Completed") return "assessment";
  return "applied";
}

function mapWorkMode(value: string | null | undefined): Job["workMode"] {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "remote" || normalized === "onsite" || normalized === "hybrid") return normalized;
  return "hybrid";
}

function mapEmploymentType(value: string | null | undefined): Job["employmentType"] {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (normalized === "internship" || normalized === "contract" || normalized === "full_time") {
    return normalized;
  }
  if (normalized === "fulltime") return "full_time";
  return "full_time";
}

function mapJob(row: BackendJobRow): Job {
  const skills = [
    ...(row.previewMatch?.matchedSkills ?? []),
    ...(row.previewMatch?.missingSkills ?? []),
  ];

  return {
    id: String(row.job_id),
    title: row.job_title,
    company: row.company_name,
    location: row.location ?? "Not specified",
    workMode: mapWorkMode(row.work_mode),
    employmentType: mapEmploymentType(row.employment_type),
    salaryMin: row.salary_min ?? undefined,
    salaryMax: row.salary_max ?? undefined,
    experienceLevel: `${row.experience_required ?? 0} years`,
    requiredSkills: skills.length > 0 ? skills : ["See job description"],
    description: row.description,
    postedAt: row.created_at,
    applicantsCount: Number(row.applicants_count ?? 0),
    matchScore: row.previewMatch?.matchScore ?? row.application?.match_score ?? undefined,
    applied: Boolean(row.application),
    stage: mapJobStage(row.application),
  };
}

async function authedFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
      body: init.body,
    });
  } catch {
    throw new Error("Can't reach the CareerIQ server. Check that the backend is running.");
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status}).`);
  }
  return body as T;
}

export async function getJobs(): Promise<Job[]> {
  const data = await authedFetch<{ jobs: BackendJobRow[] }>("/api/candidate/jobs");
  return data.jobs.map(mapJob);
}

export interface ApplyResult {
  applicationId: string;
  status: string;
  matchScore?: number;
}

export async function applyToJob(jobId: string): Promise<ApplyResult> {
  const data = await authedFetch<{
    application: { application_id: number; status: string; match_score: number | string | null };
    match: { matchScore: number } | null;
  }>("/api/applications", {
    method: "POST",
    body: JSON.stringify({ jobId: Number(jobId) }),
  });

  return {
    applicationId: String(data.application.application_id),
    status: data.application.status,
    matchScore: data.match?.matchScore,
  };
}
