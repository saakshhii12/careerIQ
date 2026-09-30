import { apiClient } from "./client";

export interface AdminRecruiter {
  recruiterId: number;
  userId: number;
  name: string;
  email: string;
  designation?: string | null;
}

export interface AdminCompany {
  companyId: number;
  companyName: string;
  industry?: string | null;
  location?: string | null;
  recruiters: AdminRecruiter[];
}

export interface AdminOverview {
  users: {
    total_users: number;
    students: number;
    recruiters: number;
    admins: number;
  };
  companies: number;
  jobs: { total_jobs: number; open_jobs: number };
  applications: {
    total_applications: number;
    shortlisted: number;
    rejected: number;
    quiz_passed: number;
  };
  interviews: { total_interviews: number; completed_interviews: number };
  quizAttempts: number;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  return apiClient("/admin/overview");
}

export async function getAllotment(): Promise<{
  companies: AdminCompany[];
  unassignedRecruiters: AdminRecruiter[];
}> {
  return apiClient("/admin/allotment");
}

export async function assignRecruiter(recruiterId: number, companyId: number | null): Promise<void> {
  await apiClient(`/admin/recruiters/${recruiterId}`, {
    method: "PATCH",
    body: { companyId },
  });
}

export async function createCompanyRecruiter(input: {
  fullName: string;
  email: string;
  password: string;
  companyId: number;
  designation?: string;
}): Promise<void> {
  await apiClient("/admin/recruiters", { method: "POST", body: input });
}

export async function listCompanies(): Promise<{ companyId: number; companyName: string }[]> {
  const data = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/auth/companies`
  ).then(async (res) => {
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((body as { error?: string }).error ?? "Unable to load companies.");
    return body;
  });
  return data.companies ?? [];
}
