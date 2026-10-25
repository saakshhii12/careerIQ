import { buildResumeParsePrompt } from "./ai-prompts.js";
import { callQwenAPI, extractJson } from "./qwen.js";

/** Structured resume parse via the centralized AI service. */
export async function parseResumeText(resumeText) {
  const text = await callQwenAPI(buildResumeParsePrompt(resumeText));
  return extractJson(text, "object");
}
