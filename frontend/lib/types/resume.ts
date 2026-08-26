export type ResumeAnalysisStatus = "none" | "uploading" | "analyzing" | "complete" | "error";

export interface ResumeState {
  status: ResumeAnalysisStatus;
  fileName?: string;
  uploadedAt?: string;
  // Note: extracted fields (skills, experience, education, etc.) are
  // intentionally NOT part of this client-facing type. The analysis result
  // populates the student's profile server-side; students only ever see
  // upload status here, never the extracted data itself.
}
