import { query } from "../db.js";
import { callQwenAPI, extractJson } from "./qwen.js";

/**
 * Persists structured resume analysis to resume_analysis when a resume is uploaded.
 */
export async function upsertResumeAnalysis(resumeId, resumeText, parsedData = {}) {
  if (!resumeId || !resumeText?.trim()) return null;

  const prompt = `Analyze this resume for ATS readiness and return ONLY valid JSON.

Resume:
${resumeText.slice(0, 12000)}

Parsed summary (may be partial):
${JSON.stringify(parsedData || {}, null, 2)}

Return ONLY this JSON:
{
  "atsScore": <integer 0-100>,
  "strengths": "<2-3 sentences>",
  "weaknesses": "<2-3 sentences>",
  "missingSkills": "<comma-separated skills to develop, or empty string>",
  "recommendation": "<one actionable sentence>"
}

Base scores ONLY on the resume text. Do not invent employers or credentials.`;

  const text = await callQwenAPI(prompt, 600);
  const analysis = extractJson(text, "object");
  const atsScore = Number(analysis.atsScore);
  if (!Number.isInteger(atsScore) || atsScore < 0 || atsScore > 100) {
    throw new Error("Invalid ATS score from resume analysis.");
  }

  await query(
    `INSERT INTO resume_analysis (resume_id, ats_score, strengths, weaknesses, missing_skills, recommendation)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (resume_id) DO UPDATE SET
       ats_score = EXCLUDED.ats_score,
       strengths = EXCLUDED.strengths,
       weaknesses = EXCLUDED.weaknesses,
       missing_skills = EXCLUDED.missing_skills,
       recommendation = EXCLUDED.recommendation`,
    [
      resumeId,
      atsScore,
      String(analysis.strengths || ""),
      String(analysis.weaknesses || ""),
      String(analysis.missingSkills || ""),
      String(analysis.recommendation || ""),
    ]
  );

  return analysis;
}
