import { StudentProfile } from "@/lib/types/profile";
import { BACKEND_URL, getToken } from "./config";

interface BackendProfileResponse {
  profile: {
    full_name: string;
    email: string;
    phone?: string | null;
    college_name?: string | null;
    degree?: string | null;
    specialization?: string | null;
    graduation_year?: number | null;
    city?: string | null;
    cgpa?: number | string | null;
    photo_path?: string | null;
  };
  resume: {
    resume_name?: string;
    uploaded_at?: string;
    has_extracted_text?: boolean;
  } | null;
  skills?: Array<{ skill_name: string; proficiency_level?: string | null }>;
  identity?: {
    hasPhoto?: boolean;
    hasFaceDescriptor?: boolean;
    photoUploadedAt?: string | null;
  };
}

async function authedFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  return body as T;
}

function mapProfile(data: BackendProfileResponse): StudentProfile {
  const photoPath = data.profile.photo_path;
  return {
    fullName: data.profile.full_name,
    email: data.profile.email,
    phone: data.profile.phone ?? "",
    collegeName: data.profile.college_name ?? "",
    degree: data.profile.degree ?? "",
    specialization: data.profile.specialization ?? "",
    graduationYear: data.profile.graduation_year ?? undefined,
    city: data.profile.city ?? "",
    skills: (data.skills ?? []).map((row) => row.skill_name),
    photoUrl: photoPath ? `${BACKEND_URL}${photoPath}` : undefined,
    hasVerificationPhoto: Boolean(data.identity?.hasPhoto || photoPath),
  };
}

export async function getProfile(): Promise<StudentProfile> {
  const data = await authedFetch<BackendProfileResponse>("/api/candidate/profile");
  return mapProfile(data);
}

export async function updateProfile(input: {
  fullName?: string;
  phone?: string;
  collegeName?: string;
  degree?: string;
  specialization?: string;
  graduationYear?: number | null;
  city?: string;
}): Promise<StudentProfile> {
  await authedFetch("/api/candidate/profile", {
    method: "PUT",
    body: JSON.stringify({
      fullName: input.fullName,
      phone: input.phone,
      collegeName: input.collegeName,
      degree: input.degree,
      specialization: input.specialization,
      graduationYear: input.graduationYear,
      city: input.city,
    }),
  });
  return getProfile();
}

export async function updateProfilePhoto(file: File, faceDescriptor?: number[]): Promise<StudentProfile> {
  const token = getToken();
  const form = new FormData();
  form.append("photo", file);
  if (faceDescriptor) form.append("faceDescriptor", JSON.stringify(faceDescriptor));

  const res = await fetch(`${BACKEND_URL}/api/candidate/photo`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? "Unable to upload verification photo.");
  return getProfile();
}

export async function getBackendProfile() {
  return authedFetch<BackendProfileResponse>("/api/candidate/profile");
}
