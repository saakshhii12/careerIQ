import { RecruiterInboxThread, RecruiterMessage, RecruiterThread } from "@/lib/types/chat";
import { apiClient } from "./client";

/**
 * Recruiter messaging — human-to-human, and distinct from the Career Assistant.
 *
 * A thread is returned for every application so the UI can explain the locked
 * state, but messages are only present once the candidate is shortlisted
 * (passing AI interview). The backend re-checks that rule on every send.
 */
export async function getRecruiterThreads(): Promise<{
  threads: RecruiterThread[];
  unlockedCount: number;
}> {
  return apiClient<{ threads: RecruiterThread[]; unlockedCount: number }>("/messages/threads");
}

export async function sendRecruiterMessage(
  applicationId: string,
  text: string
): Promise<RecruiterMessage> {
  const data = await apiClient<{ message: RecruiterMessage }>(
    `/messages/threads/${applicationId}`,
    { method: "POST", body: { text } }
  );
  return data.message;
}

export async function getRecruiterInbox(): Promise<RecruiterInboxThread[]> {
  const data = await apiClient<{ threads: RecruiterInboxThread[] }>("/messages/recruiter/threads");
  return data.threads;
}

export async function sendMessageAsRecruiter(
  applicationId: string,
  text: string
): Promise<RecruiterMessage> {
  const data = await apiClient<{ message: RecruiterMessage }>(
    `/messages/recruiter/threads/${applicationId}`,
    { method: "POST", body: { text } }
  );
  return data.message;
}
