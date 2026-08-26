import { Conversation, ChatMessage } from "@/lib/types/chat";
import { MOCK_APPLICATIONS } from "./mock/applications";
import { USE_MOCK_API, mockDelay } from "./config";
import { apiClient } from "./client";

/**
 * Chat is derived from applications, not created on apply. A conversation
 * exists (in locked form) for every application, but `unlocked` only flips
 * to true once the recruiter has accepted the candidate — per the platform
 * rule that candidates and recruiters cannot message each other until then.
 */
const mockConversations: Conversation[] = MOCK_APPLICATIONS.map((app) => ({
  id: `conv-${app.jobId}`,
  jobId: app.jobId,
  jobTitle: app.jobTitle,
  company: app.company,
  unlocked: app.currentStage === "accepted",
  createdAt: app.timeline[0]?.occurredAt ?? new Date().toISOString(),
  messages:
    app.currentStage === "accepted"
      ? [
          {
            id: `m-${app.jobId}-1`,
            sender: "system",
            text: `You're in! ${app.company} has accepted your application for ${app.jobTitle}. You can message the recruiter here to coordinate next steps.`,
            sentAt: app.timeline[app.timeline.length - 1].occurredAt,
          },
        ]
      : [],
}));

export async function getConversations(): Promise<Conversation[]> {
  if (USE_MOCK_API) return mockDelay([...mockConversations]);
  return apiClient<Conversation[]>("/students/me/conversations");
}

export async function sendMessage(conversationId: string, text: string): Promise<ChatMessage> {
  if (USE_MOCK_API) {
    const conversation = mockConversations.find((c) => c.id === conversationId);
    if (!conversation?.unlocked) {
      throw new Error("This chat is locked until the recruiter accepts your application.");
    }
    const message: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: "student",
      text,
      sentAt: new Date().toISOString(),
    };
    conversation.messages.push(message);
    return mockDelay(message, 200);
  }
  return apiClient<ChatMessage>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: { text },
  });
}
