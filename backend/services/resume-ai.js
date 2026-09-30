import { buildResumeParsePrompt } from "./ai-prompts.js";
import { callQwenAPI, extractJson } from "./qwen.js";

/** Structured resume parse via centralized Qwen/Hugging Face service. */
export async function parseResumeText(resumeText) {
  const text = await callQwenAPI(buildResumeParsePrompt(resumeText));
  return extractJson(text, "object");
}
