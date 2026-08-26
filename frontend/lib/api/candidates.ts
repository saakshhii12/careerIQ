import { Candidate } from "@/lib/types/candidate";
import { ApplicationStage } from "@/lib/types/application";
import { USE_MOCK_API, mockDelay } from "./config";
import { apiClient } from "./client";
import { MOCK_CANDIDATES } from "./mock/candidates";

export async function getCandidates(): Promise<Candidate[]> {
  if (USE_MOCK_API) return mockDelay([...MOCK_CANDIDATES]);
  return apiClient<Candidate[]>("/recruiters/me/candidates");
}

export async function getCandidateById(id: string): Promise<Candidate | undefined> {
  if (USE_MOCK_API) return mockDelay(MOCK_CANDIDATES.find((c) => c.id === id));
  return apiClient<Candidate>(`/recruiters/me/candidates/${id}`);
}

const DECISION_STAGE: Record<"accept" | "reject" | "waitlist", ApplicationStage> = {
  accept: "accepted",
  reject: "rejected",
  waitlist: "waitlisted",
};

export async function decideCandidate(
  id: string,
  decision: "accept" | "reject" | "waitlist"
): Promise<Candidate> {
  if (USE_MOCK_API) {
    const candidate = MOCK_CANDIDATES.find((c) => c.id === id);
    if (!candidate) throw new Error("Candidate not found");
    candidate.stage = DECISION_STAGE[decision];
    return mockDelay({ ...candidate }, 400);
  }
  return apiClient<Candidate>(`/recruiters/me/candidates/${id}/decision`, {
    method: "POST",
    body: { decision },
  });
}
