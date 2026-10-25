/**
 * Safe Groq diagnostic. Never prints the API key or request headers.
 * Usage: node scripts/diagnose-groq.mjs
 */
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const apiKey = process.env.GROQ_API_KEY || "";
const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
console.log("Groq API key configured:", Boolean(apiKey));
console.log("model:", model);

if (!apiKey) {
  console.error("Set GROQ_API_KEY in backend/.env before running this diagnostic.");
  process.exit(1);
}

try {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Reply with the single word OK." }],
      max_completion_tokens: 128,
      temperature: 0.2,
    }),
  });

  let result;
  try {
    result = await response.json();
  } catch {
    result = null;
  }
  const text = result?.choices?.[0]?.message?.content;
  const ok = response.ok && typeof text === "string" && text.trim().length > 0;
  console.log("Groq request:", { ok, status: response.status, hasText: Boolean(text?.trim()) });
  if (!ok) {
    const providerError = result?.error;
    const safeValue = (value) =>
      String(value)
        .replaceAll(apiKey, "[REDACTED]")
        .replace(/(authorization\s*[:=]\s*bearer\s+)[^\s,;]+/gi, "$1[REDACTED]")
        .replace(/\bBearer\s+[^\s,;]+/gi, "Bearer [REDACTED]");
    console.error("Groq provider error:", {
      status: response.status,
      ...(providerError?.code !== undefined ? { code: safeValue(providerError.code) } : {}),
      ...(providerError?.type !== undefined ? { type: safeValue(providerError.type) } : {}),
      ...(typeof providerError?.message === "string"
        ? { message: safeValue(providerError.message) }
        : {}),
    });
    process.exitCode = 1;
  }
} catch {
  console.error("Groq request failed before receiving an HTTP response.");
  process.exitCode = 1;
}
