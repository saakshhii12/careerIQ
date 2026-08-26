import { StudentProfile } from "@/lib/types/profile";
import { USE_MOCK_API, mockDelay } from "./config";
import { apiClient } from "./client";

let mockProfile: StudentProfile = {
  fullName: "Aditi Rao",
  email: "aditi.rao@example.com",
  phone: "",
};

export async function getProfile(): Promise<StudentProfile> {
  if (USE_MOCK_API) return mockDelay({ ...mockProfile });
  return apiClient<StudentProfile>("/students/me/profile");
}

export async function updateProfilePhoto(file: File): Promise<StudentProfile> {
  if (USE_MOCK_API) {
    const url = URL.createObjectURL(file);
    mockProfile = { ...mockProfile, photoUrl: url };
    return mockDelay({ ...mockProfile }, 500);
  }
  const formData = new FormData();
  formData.append("photo", file);
  return apiClient<StudentProfile>("/students/me/profile/photo", {
    method: "POST",
    body: formData as unknown as BodyInit,
    headers: {},
  });
}
