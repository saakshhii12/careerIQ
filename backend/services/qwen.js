import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = process.env.HF_MODEL || "Qwen/Qwen3-8B";
const HF_PROVIDER = process.env.HF_PROVIDER || "nscale";
const hfClient = new InferenceClient(HF_TOKEN);

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
    console.error("Hugging Face API Error:", { message: error.message, status, details });
    throw new Error(
      status
        ? `Hugging Face request failed (${status}): ${typeof details === "string" ? details : JSON.stringify(details)}`
        : `Hugging Face request failed: ${error.message}`
    );
  }
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
