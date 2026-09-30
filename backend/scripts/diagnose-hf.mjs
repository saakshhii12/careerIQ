/**
 * Safe Hugging Face diagnostic. Never prints token or Authorization headers.
 * Usage: node scripts/diagnose-hf.mjs
 */
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { InferenceClient } from "@huggingface/inference";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const token = process.env.HF_TOKEN || "";
const model = process.env.HF_MODEL || "Qwen/Qwen3-8B";
const provider = process.env.HF_PROVIDER || "nscale";

const safeTokenInfo = {
  present: Boolean(token),
  length: token.length,
  startsWithHf: token.startsWith("hf_"),
  hasWhitespace: /\s/.test(token),
  wrappedInQuotes: token.startsWith('"') || token.startsWith("'"),
};

console.log("token:", safeTokenInfo);
console.log("model:", model);
console.log("provider:", provider);

if (!token) {
  process.exit(1);
}

try {
  const whoami = await fetch("https://huggingface.co/api/whoami-v2", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await whoami.json().catch(() => ({}));
  console.log("whoami status:", whoami.status);
  console.log("whoami ok:", whoami.ok);
  console.log("whoami error:", typeof body.error === "string" ? body.error : undefined);
  console.log("whoami type:", body.type || body.auth?.type || undefined);
} catch (error) {
  console.log("whoami network error:", error.message);
}

async function tryChat(label, options) {
  const client = new InferenceClient(token);
  try {
    const completion = await client.chatCompletion({
      model,
      messages: [{ role: "user", content: "Reply with the single word OK." }],
      max_tokens: 16,
      ...options,
    });
    const text = completion.choices?.[0]?.message?.content;
    console.log(label, {
      ok: true,
      hasText: typeof text === "string" && text.trim().length > 0,
    });
  } catch (error) {
    console.log(label, {
      ok: false,
      status: error?.httpResponse?.status ?? error?.status,
      message: error.message,
    });
  }
}

await tryChat("chat nscale", { provider });
await tryChat("chat auto", { provider: "auto" });
await tryChat("chat hf-inference", { provider: "hf-inference" });
