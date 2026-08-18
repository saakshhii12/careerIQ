/**
 * types/chat.ts
 * Shared types for the chatbot feature. Kept dependency-free so this
 * file can be copied verbatim into the main CareerIQ project.
 */

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string; // ISO string — serializable, safe to send over the wire
}

/** Shape sent to the API route / used as conversation history */
export interface ChatHistoryItem {
  role: ChatRole;
  content: string;
}

export interface ChatApiRequestBody {
  messages: ChatHistoryItem[];
}

export interface ChatApiSuccessResponse {
  reply: string;
}

export interface ChatApiErrorResponse {
  error: string;
}

export type ChatApiResponse = ChatApiSuccessResponse | ChatApiErrorResponse;
