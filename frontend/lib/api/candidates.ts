import { Candidate } from "@/lib/types/candidate";
import { apiClient } from "./client";

export async function getCandidates(): Promise<Candidate[]> {
  return apiClient<Candidate[]>("/recruiters/me/candidates");
}

export async function getCandidateById(id: string): Promise<Candidate | undefined> {
  try {
    return await apiClient<Candidate>(`/recruiters/me/candidates/${id}`);
  } catch {
    return undefined;
  }
}

export async function decideCandidate(
  id: string,
  decision: "shortlist" | "accept" | "reject" | "waitlist"
): Promise<Candidate> {
  return apiClient<Candidate>(`/recruiters/me/candidates/${id}/decision`, {
    method: "POST",
    body: { decision },
  });
}

export async function downloadCandidateResume(id: string): Promise<void> {
  const { API_BASE_URL, getToken } = await import("./config");
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/recruiters/me/candidates/${id}/resume`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error("Unable to download this resume.");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const disposition = res.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  anchor.href = url;
  anchor.download = match?.[1] || "resume.pdf";
  anchor.click();
  URL.revokeObjectURL(url);
}
