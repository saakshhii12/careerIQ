import { AssistantConversation, AssistantMessage } from "@/lib/types/assistant";
import { apiClient } from "./client";

/**
 * Career Assistant transport.
 *
 * The candidate's resume, profile, skills, and applications are assembled
 * server-side from the authenticated user's own rows — this client deliberately
 * sends nothing but the message text.
 */
export async function getAssistantConversation(): Promise<AssistantConversation> {
  return apiClient<AssistantConversation>("/assistant/conversation");
}

export async function sendAssistantMessage(
  message: string
): Promise<{ userMessage: AssistantMessage; reply: AssistantMessage }> {
  return apiClient<{ userMessage: AssistantMessage; reply: AssistantMessage }>(
    "/assistant/messages",
    { method: "POST", body: { message } }
  );
}

export async function clearAssistantConversation(): Promise<void> {
  await apiClient("/assistant/conversation", { method: "DELETE" });
}
