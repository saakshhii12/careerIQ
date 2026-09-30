import { RecruiterDashboard } from "@/lib/types/recruiter";
import { apiClient } from "./client";

export async function getRecruiterDashboard(): Promise<RecruiterDashboard> {
  return apiClient<RecruiterDashboard>("/recruiters/me/dashboard");
}

export interface RecruiterSettings {
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  companyName: string;
}

export async function getRecruiterSettings(): Promise<RecruiterSettings> {
  return apiClient<RecruiterSettings>("/recruiters/me/settings");
}

export async function updateRecruiterSettings(
  patch: Partial<Pick<RecruiterSettings, "fullName" | "phone" | "designation">>
): Promise<RecruiterSettings> {
  return apiClient<RecruiterSettings>("/recruiters/me/settings", { method: "PATCH", body: patch });
}
