import { CompanyProfile } from "@/lib/types/company";
import { apiClient } from "./client";

export async function getCompanyProfile(): Promise<CompanyProfile> {
  return apiClient<CompanyProfile>("/recruiters/me/company");
}

export async function updateCompanyProfile(patch: Partial<CompanyProfile>): Promise<CompanyProfile> {
  return apiClient<CompanyProfile>("/recruiters/me/company", { method: "PATCH", body: patch });
}

export async function updateCompanyLogo(file: File): Promise<CompanyProfile> {
  const url = URL.createObjectURL(file);
  return updateCompanyProfile({ logoUrl: url });
}
