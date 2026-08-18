/**
 * app/api/chat/route.ts
 * ------------------------------------------------------------------
 * Thin Route Handler. All real logic lives in
 * features/chatbot/services/groqServer.ts — this file just validates
 * the request shape and translates errors into HTTP responses.
 *
 * POST /api/chat
 * body: { messages: [{ role: 'user' | 'assistant', content: string }] }
 * returns: { reply: string } | { error: string }
 * ------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from "next/server";
import { sendChatMessage, ChatServiceError } from "@/features/chatbot/services/groqServer";
import type { ChatApiRequestBody, ChatHistoryItem } from "@/features/chatbot/types/chat";

function isValidHistory(value: unknown): value is ChatHistoryItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string"
    )
  );
}

export async function POST(request: NextRequest) {
  let body: ChatApiRequestBody;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isValidHistory(body?.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "`messages` array is required." }, { status: 400 });
  }

  try {
    const reply = await sendChatMessage(body.messages);
    return NextResponse.json({ reply });
  } catch (err) {
    const status = err instanceof ChatServiceError ? err.status || 500 : 500;
    const message =
      err instanceof ChatServiceError ? err.message : "Something went wrong. Please try again.";
    return NextResponse.json({ error: message }, { status });
  }
}
