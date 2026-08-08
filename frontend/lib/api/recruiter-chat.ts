import { RecruiterConversation } from "@/lib/types/recruiter-chat";
import { ChatMessage } from "@/lib/types/chat";
import { USE_MOCK_API, mockDelay } from "./config";
import { apiClient } from "./client";
import { MOCK_RECRUITER_CONVERSATIONS } from "./mock/recruiter-chat";

export async function getRecruiterConversations(): Promise<RecruiterConversation[]> {
  if (USE_MOCK_API) return mockDelay([...MOCK_RECRUITER_CONVERSATIONS]);
  return apiClient<RecruiterConversation[]>("/recruiters/me/conversations");
}

export async function sendRecruiterMessage(conversationId: string, text: string): Promise<ChatMessage> {
  if (USE_MOCK_API) {
    const conversation = MOCK_RECRUITER_CONVERSATIONS.find((c) => c.id === conversationId);
    const message: ChatMessage = {
      id: `rm-${Date.now()}`,
      sender: "recruiter",
      text,
      sentAt: new Date().toISOString(),
    };
    conversation?.messages.push(message);
    return mockDelay(message, 200);
  }
  return apiClient<ChatMessage>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: { text },
  });
}
