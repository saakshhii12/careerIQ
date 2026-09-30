export interface AssistantMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  sentAt: string;
}

/**
 * Summary of the candidate data the backend loaded to ground the assistant.
 * Used to tell the candidate what the assistant can actually see.
 */
export interface AssistantContext {
  candidateName: string;
  hasResume: boolean;
  resumeName: string | null;
  applicationCount: number;
}

export interface AssistantConversation {
  conversationId: string;
  messages: AssistantMessage[];
  context: AssistantContext;
}
