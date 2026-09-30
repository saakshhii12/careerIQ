import { ResumeState } from "@/lib/types/resume";
import { BACKEND_URL, getToken } from "./config";
import { getBackendProfile } from "./profile";
import { extractTextFromPDF } from "@/lib/resume/pdf";

export async function getResumeStatus(): Promise<ResumeState> {
  const data = await getBackendProfile();
  if (!data.resume?.resume_name) {
    return { status: "none" };
  }
  return {
    status: "complete",
    fileName: data.resume.resume_name,
    uploadedAt: data.resume.uploaded_at,
  };
}

export async function uploadResume(file: File): Promise<ResumeState> {
  const extractedText = await extractTextFromPDF(file);
  const token = getToken();
  const formData = new FormData();
  formData.append("resume", file);
  formData.append("extractedText", extractedText);

  const res = await fetch(`${BACKEND_URL}/api/candidate/resume`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error ?? "Resume upload failed.");
  }

  return {
    status: "complete",
    fileName: (body as { resume?: { resume_name?: string } }).resume?.resume_name ?? file.name,
    uploadedAt: new Date().toISOString(),
  };
}
