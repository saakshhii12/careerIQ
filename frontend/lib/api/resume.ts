import { ResumeState } from "@/lib/types/resume";
import { USE_MOCK_API } from "./config";
import { apiClient } from "./client";

// In-memory mock store so the status persists across the query cache
// within a session, similar to how a real backend would persist it.
let mockResumeState: ResumeState = { status: "none" };

export async function getResumeStatus(): Promise<ResumeState> {
  if (USE_MOCK_API) {
    return { ...mockResumeState };
  }
  return apiClient<ResumeState>("/students/me/resume");
}

export async function uploadResume(file: File): Promise<ResumeState> {
  if (USE_MOCK_API) {
    mockResumeState = { status: "uploading", fileName: file.name };
    await new Promise((r) => setTimeout(r, 700));
    mockResumeState = { ...mockResumeState, status: "analyzing" };
    await new Promise((r) => setTimeout(r, 1600));
    mockResumeState = {
      status: "complete",
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
    };
    // Real backend: PyMuPDF extracts text -> SBERT/skill parser fills the
    // student profile server-side. None of that payload is returned here.
    return { ...mockResumeState };
  }

  const formData = new FormData();
  formData.append("file", file);
  // apiClient assumes JSON; a real implementation would use a raw fetch
  // with FormData and no Content-Type header (browser sets the boundary).
  return apiClient<ResumeState>("/students/me/resume", {
    method: "POST",
    body: formData as unknown as BodyInit,
    headers: {},
  });
}
