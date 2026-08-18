/**
 * services/chatClient.ts
 * ------------------------------------------------------------------
 * CLIENT-SIDE. The only file browser code calls to talk to the
 * assistant. It hits our own Route Handler (/api/chat), which calls
 * Groq on the server. The browser never sees the Groq API key or
 * endpoint.
 * ------------------------------------------------------------------
 */

import type { ChatHistoryItem, ChatApiResponse } from "../types/chat";

export class ChatClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ChatClientError";
    this.status = status;
  }
}

export async function sendChatMessage(history: ChatHistoryItem[]): Promise<string> {
  let response: Response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });
  } catch (networkErr) {
    throw new ChatClientError(
      "Network error reaching the assistant. Please check your connection and try again.",
      0
    );
  }

  const data = (await response.json().catch(() => null)) as ChatApiResponse | null;

  if (!response.ok || !data) {
    const message = data && "error" in data ? data.error : `Assistant request failed (status ${response.status}).`;
    throw new ChatClientError(message, response.status);
  }

  if (!("reply" in data) || !data.reply) {
    throw new ChatClientError("The assistant returned an empty response.", 500);
  }

  return data.reply;
}

export default sendChatMessage;
