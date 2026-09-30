import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

// This module is imported before server.js finishes, so load backend/.env here
// by file path. A cwd-relative lookup misses the file when Node is started from
// the repo root. Never log the token value.
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

export const DEFAULT_HF_MODEL = "Qwen/Qwen3-8B";
export const DEFAULT_HF_PROVIDER = "nscale";

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = process.env.HF_MODEL || DEFAULT_HF_MODEL;
const HF_PROVIDER = process.env.HF_PROVIDER || DEFAULT_HF_PROVIDER;
const hfClient = new InferenceClient(HF_TOKEN);

/** Runtime LLM configuration (never includes HF_TOKEN). */
export function getAiRuntimeConfig() {
  return {
    model: HF_MODEL,
    provider: HF_PROVIDER,
    hfTokenConfigured: Boolean(HF_TOKEN),
  };
}

/**
 * Multi-turn chat completion. Used by the Career Assistant, which needs a
 * system prompt plus conversation history rather than a single prompt string.
 *
 * Throws an Error carrying `.status` when Hugging Face returns an HTTP error so
 * callers can map rate limits and outages to the right response code.
 */
export async function chatWithQwen(messages, { maxTokens = 700, temperature = 0.4 } = {}) {
  if (!HF_TOKEN) {
    const error = new Error("AI service is not configured on the server.");
    error.status = 503;
    throw error;
  }

  try {
    const completion = await hfClient.chatCompletion({
      provider: HF_PROVIDER,
      model: HF_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature,
    });

    const text = completion.choices?.[0]?.message?.content;
    if (typeof text !== "string" || text.trim().length === 0) {
      throw new Error("The AI model returned an empty response.");
    }
    return text.trim();
  } catch (error) {
    const status = error?.httpResponse?.status;
    // Never log HF_TOKEN or the request headers.
    console.error("Hugging Face chat error:", { message: error.message, status });
    const wrapped = new Error(clientFacingAiMessage(status, error.message));
    wrapped.status = status === 429 ? 429 : 503;
    throw wrapped;
  }
}

export async function callQwenAPI(prompt, maxTokens = 500) {
  if (!HF_TOKEN) {
    throw new Error("HF_TOKEN is not configured on the server.");
  }

  try {
    const completion = await hfClient.chatCompletion({
      provider: HF_PROVIDER,
      model: HF_MODEL,
      messages: [
        {
          role: "system",
          content:
            "/no_think\nFollow the user's requested output format exactly. Do not add markdown unless asked.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.2,
    });

    const text = completion.choices?.[0]?.message?.content;
    if (typeof text !== "string" || text.trim().length === 0) {
      throw new Error("Hugging Face returned an empty response.");
    }
    return text;
  } catch (error) {
    const status = error?.httpResponse?.status;
    const details = error?.httpResponse?.body;
    // Log the provider response server-side for diagnosis. HF_TOKEN is never
    // included: the SDK keeps it in request headers, not in the response body.
    console.error("Hugging Face API Error:", { message: error.message, status, details });

    const wrapped = new Error(clientFacingAiMessage(status, error.message));
    wrapped.status = status === 429 ? 429 : 503;
    throw wrapped;
  }
}

/**
 * Maps a Hugging Face failure to a message that is safe and useful for the
 * client. Provider payloads can echo request context, so they are logged but
 * never forwarded.
 */
function clientFacingAiMessage(status, fallback) {
  if (status === 401 || status === 403) {
    return "The AI service credentials are invalid or expired. Ask an administrator to refresh HF_TOKEN on the server.";
  }
  if (status === 429) {
    return "AI service rate limit reached. Please wait a moment and try again.";
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
    throw new Error(`No JSON ${type} found in Qwen response.`);
  }
  return JSON.parse(match[0]);
}

export function errorMessage(error) {
  return error instanceof Error ? error.message : "Unknown server error";
}
