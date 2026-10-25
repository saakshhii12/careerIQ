import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

// This module is imported before server.js finishes, so load backend/.env here
// by file path. A cwd-relative lookup misses the file when Node is started from
// the repo root. Never log the API key.
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

/** Runtime LLM configuration (never includes GROQ_API_KEY). */
export function getAiRuntimeConfig() {
  return {
    model: GROQ_MODEL,
    provider: "Groq",
    apiKeyConfigured: Boolean(GROQ_API_KEY),
  };
}

/**
 * Multi-turn chat completion. Used by the Career Assistant, which needs a
 * system prompt plus conversation history rather than a single prompt string.
 *
 * Throws an Error carrying `.status` when the provider returns an HTTP error so
 * callers can map rate limits and outages to the right response code.
 */
export async function chatWithQwen(messages, { maxTokens = 700, temperature = 0.4 } = {}) {
  if (!GROQ_API_KEY) {
    throw aiConfigurationError();
  }

  try {
    const text = await generateGroqText(messages, maxTokens, temperature);
    if (!text.trim()) {
      throw new Error("The AI model returned an empty response.");
    }
    return text.trim();
  } catch (error) {
    throw wrapGroqError("Groq chat error:", error);
  }
}

export async function callQwenAPI(prompt, maxTokens = 500, { responseFormat } = {}) {
  if (!GROQ_API_KEY) {
    throw aiConfigurationError();
  }

  try {
    const text = await generateGroqText(
      [
        {
          role: "system",
          content:
            "/no_think\nFollow the user's requested output format exactly. Do not add markdown unless asked.",
        },
        { role: "user", content: prompt },
      ],
      maxTokens,
      0.2,
      responseFormat
    );

    if (!text.trim()) {
      throw new Error("The AI model returned an empty response.");
    }
    return text;
  } catch (error) {
    throw wrapGroqError("Groq API error:", error);
  }
}

async function generateGroqText(messages, maxTokens, temperature, responseFormat) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      max_completion_tokens: maxTokens,
      temperature,
      ...(GROQ_MODEL === DEFAULT_GROQ_MODEL
        ? { reasoning_effort: "low", include_reasoning: false }
        : {}),
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
  });

  if (!response.ok) {
    const error = new Error("Groq API request failed.");
    error.status = response.status;
    try {
      const body = await response.json();
      if (body?.error && typeof body.error === "object") {
        error.providerError = {
          ...(typeof body.error.code === "number" || typeof body.error.code === "string"
            ? { code: body.error.code }
            : {}),
          ...(typeof body.error.type === "string" ? { status: body.error.type } : {}),
          ...(typeof body.error.message === "string"
            ? {
                message: messages.reduce(
                  (safeMessage, item) =>
                    item.content
                      ? safeMessage.replaceAll(item.content, "[REDACTED]")
                      : safeMessage,
                  body.error.message
                ),
              }
            : {}),
        };
      }
    } catch {
      // Keep logging the HTTP status if the error response is not valid JSON.
    }
    throw error;
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Groq returned an invalid response.");
  }

  const choice = result?.choices?.[0];
  const safeMetadata = {
    ...(typeof choice?.finish_reason === "string"
      ? {
          finishReason: ["stop", "length", "tool_calls", "content_filter", "function_call"].includes(
            choice.finish_reason
          )
            ? choice.finish_reason
            : "other",
        }
      : {}),
    ...(Number.isFinite(result?.usage?.completion_tokens)
      ? { completionTokens: result.usage.completion_tokens }
      : {}),
  };

  if (choice?.finish_reason === "length") {
    const error = new Error("The AI model returned an incomplete response.");
    error.responseMetadata = safeMetadata;
    throw error;
  }

  if (typeof choice?.message?.content !== "string") {
    const error = new Error("The AI model returned an empty response.");
    error.responseMetadata = safeMetadata;
    throw error;
  }

  return choice.message.content;
}

function aiConfigurationError() {
  const error = new Error("AI service is not configured on the server.");
  error.status = 503;
  return error;
}

function wrapGroqError(label, error) {
  const status = error?.status;
  const message = error instanceof Error ? error.message : "Unknown provider error.";
  const providerError = error?.providerError;
  const safeValue = (value) => {
    let safe = String(value);
    if (GROQ_API_KEY) {
      safe = safe.replaceAll(GROQ_API_KEY, "[REDACTED]");
    }
    safe = safe
      .replace(/(authorization\s*[:=]\s*bearer\s+)[^\s,;]+/gi, "$1[REDACTED]")
      .replace(/\bBearer\s+[^\s,;]+/gi, "Bearer [REDACTED]");
    return safe;
  };
  // Log only selected provider error fields, never request data or headers.
  console.error(label, {
    message,
    status,
    ...(error?.responseMetadata ? { response: error.responseMetadata } : {}),
    ...(providerError
      ? {
          providerError: {
            ...(providerError.code !== undefined ? { code: safeValue(providerError.code) } : {}),
            ...(providerError.status ? { status: safeValue(providerError.status) } : {}),
            ...(providerError.message ? { message: safeValue(providerError.message) } : {}),
          },
        }
      : {}),
  });
  const wrapped = new Error(clientFacingAiMessage(status, message));
  wrapped.status = status === 429 ? 429 : 503;
  return wrapped;
}

/**
 * Maps a provider failure to a message that is safe and useful for the client.
 */
function clientFacingAiMessage(status, fallback) {
  if (status === 401 || status === 403) {
    return "The AI service credentials are invalid or expired. Ask an administrator to refresh GROQ_API_KEY on the server.";
  }
  if (status === 429) {
    return "AI service rate limit or quota reached. Please wait a moment and try again.";
  }
  if (status === 402) {
    return "The AI service quota for this account has been exhausted.";
  }
  if (status === 503 || status === 504) {
    return "AI service is temporarily unavailable. Please try again.";
  }
  return status
    ? `AI service request failed (${status}). Please try again.`
    : `AI service request failed: ${fallback}`;
}

export function extractJson(text, type = "object") {
  const pattern = type === "array" ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = text.match(pattern);
  if (!match) {
    throw new Error(`No JSON ${type} found in AI response.`);
  }
  return JSON.parse(match[0]);
}

export function errorMessage(error) {
  return error instanceof Error ? error.message : "Unknown server error";
}
