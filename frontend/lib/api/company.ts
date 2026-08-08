import { CompanyProfile } from "@/lib/types/company";
import { USE_MOCK_API, mockDelay } from "./config";
import { apiClient } from "./client";

let mockCompany: CompanyProfile = {
  name: "Nimbus Systems",
  website: "https://nimbussystems.example",
  industry: "Cloud Infrastructure",
  size: "201-500 employees",
  location: "Bengaluru, India",
  description:
    "Nimbus Systems builds core infrastructure for high-growth SaaS companies, serving 400+ customers across APAC.",
};

export async function getCompanyProfile(): Promise<CompanyProfile> {
  if (USE_MOCK_API) return mockDelay({ ...mockCompany });
  return apiClient<CompanyProfile>("/recruiters/me/company");
}

export async function updateCompanyProfile(patch: Partial<CompanyProfile>): Promise<CompanyProfile> {
  if (USE_MOCK_API) {
    mockCompany = { ...mockCompany, ...patch };
    return mockDelay({ ...mockCompany }, 400);
  }
  return apiClient<CompanyProfile>("/recruiters/me/company", { method: "PATCH", body: patch });
}

export async function updateCompanyLogo(file: File): Promise<CompanyProfile> {
  if (USE_MOCK_API) {
    mockCompany = { ...mockCompany, logoUrl: URL.createObjectURL(file) };
    return mockDelay({ ...mockCompany }, 500);
  }
  const formData = new FormData();
  formData.append("logo", file);
  return apiClient<CompanyProfile>("/recruiters/me/company/logo", {
    method: "POST",
    body: formData as unknown as BodyInit,
    headers: {},
  });
}
