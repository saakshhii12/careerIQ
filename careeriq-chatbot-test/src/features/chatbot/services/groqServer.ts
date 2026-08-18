/**
 * services/groqServer.ts
 * ------------------------------------------------------------------
 * SERVER-ONLY. Reads process.env.GROQ_API_KEY and calls Groq
 * directly. Must only ever be imported from a Route Handler
 * (src/app/api/chat/route.ts) — never from a client component.
 *
 * To swap AI providers later, this is the only file that needs to
 * change. The route handler and the frontend don't know or care
 * which provider is behind sendChatMessage().
 * ------------------------------------------------------------------
 */

import { SYSTEM_PROMPT } from "../utils/systemPrompt";
import { CHATBOT_CONFIG } from "../utils/chatConfig";
import type { ChatHistoryItem } from "../types/chat";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export class ChatServiceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ChatServiceError";
    this.status = status;
  }
}

interface GroqChoice {
  message?: { content?: string };
}

interface GroqResponseBody {
  choices?: GroqChoice[];
  error?: { message?: string };
}

export async function sendChatMessage(history: ChatHistoryItem[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new ChatServiceError(
      "Server is missing GROQ_API_KEY. Add it to .env.local and restart the dev server.",
      500
    );
  }

  const model = process.env.GROQ_MODEL || CHATBOT_CONFIG.defaultModel;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  let response: Response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: CHATBOT_CONFIG.temperature,
        max_tokens: CHATBOT_CONFIG.maxTokens,
      }),
    });
  } catch (networkErr) {
    throw new ChatServiceError("Network error reaching Groq. Please try again.", 502);
  }

  if (!response.ok) {
    let detail = "";
    try {
      const errBody = (await response.json()) as GroqResponseBody;
      detail = errBody?.error?.message || "";
    } catch (e) {
      // response body wasn't JSON — ignore
    }
    throw new ChatServiceError(
      detail || `Groq request failed (status ${response.status}).`,
      response.status
    );
  }

  const data = (await response.json()) as GroqResponseBody;
  const reply = data?.choices?.[0]?.message?.content;

  if (!reply) {
    throw new ChatServiceError("Groq returned an empty response.", 502);
  }

  return reply.trim();
}

export default sendChatMessage;
