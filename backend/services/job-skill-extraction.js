import { query } from "../db.js";
import { callQwenAPI, extractJson } from "./qwen.js";

export function normalizeSkill(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, "")
    .trim();
}

/**
 * Match catalog skills against job text (longest names first to reduce substring false positives).
 */
export function extractSkillsFromText(text, catalog) {
  const haystack = String(text || "").toLowerCase();
  const sorted = [...catalog].sort(
    (a, b) => normalizeSkill(b.skill_name).length - normalizeSkill(a.skill_name).length
  );
  const found = [];
  const seen = new Set();
  for (const skill of sorted) {
    const name = normalizeSkill(skill.skill_name);
    if (!name || seen.has(name)) continue;
    if (haystack.includes(name)) {
      found.push(skill.skill_name);
      seen.add(name);
    }
  }
  return found;
}

/** Multi-word phrases commonly present in job descriptions (not tied to a specific job title). */
const DESCRIPTION_PHRASES = [
  { pattern: /spring\s+boot/i, canonical: "Spring Boot" },
  { pattern: /power\s+bi/i, canonical: "Power BI" },
  { pattern: /machine\s+learning/i, canonical: "Machine Learning" },
  { pattern: /deep\s+learning/i, canonical: "Deep Learning" },
  { pattern: /computer\s+vision/i, canonical: "Computer Vision" },
  { pattern: /data\s+visuali(?:s|z)ation/i, canonical: "Data Visualization" },
  { pattern: /automation\s+testing|test\s+automation/i, canonical: "Test Automation" },
  { pattern: /manual\s+testing/i, canonical: "Manual Testing" },
  { pattern: /api\s+testing/i, canonical: "API Testing" },
  { pattern: /react\s*\.?\s*js|\breact\b/i, canonical: "React" },
  { pattern: /node\.?\s*js|\bnode\s+express\b|\breact\s+node\b/i, canonical: "Node.js" },
  { pattern: /\bexpress\.?\s*js\b/i, canonical: "Express.js" },
  { pattern: /\bselenium\b/i, canonical: "Selenium" },
  { pattern: /\bdocker\b/i, canonical: "Docker" },
  { pattern: /\bkubernetes\b/i, canonical: "Kubernetes" },
  { pattern: /\baws\b/i, canonical: "AWS" },
  { pattern: /\bazure\b/i, canonical: "Azure" },
  { pattern: /\btableau\b/i, canonical: "Tableau" },
  { pattern: /\bexcel\b/i, canonical: "Excel" },
  { pattern: /\betl\b/i, canonical: "ETL" },
  { pattern: /\bsoc\b/i, canonical: "SOC" },
  { pattern: /cyber\s+security|cybersecurity/i, canonical: "Cyber Security" },
  { pattern: /android\s+studio/i, canonical: "Android Studio" },
  { pattern: /full\s+stack/i, canonical: "Full Stack Development" },
  { pattern: /backend\s+api/i, canonical: "Backend Development" },
  { pattern: /product\s+development/i, canonical: "Software Development" },
];

export function extractPhraseSkills(text) {
  const body = String(text || "");
  const names = [];
  const seen = new Set();
  for (const { pattern, canonical } of DESCRIPTION_PHRASES) {
    if (!pattern.test(body)) continue;
    const key = normalizeSkill(canonical);
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(canonical);
  }
  return names;
}

export function mergeSkillNames(...lists) {
  const seen = new Set();
  const out = [];
  for (const list of lists) {
    for (const name of list || []) {
      const skill = String(name || "").trim();
      if (!skill) continue;
      const key = normalizeSkill(skill);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(skill);
    }
  }
  return out;
}

export async function getSkillCatalog() {
  const { rows } = await query("SELECT skill_id, skill_name, category FROM skills ORDER BY skill_name");
  return rows;
}

export async function resolveSkillId(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return null;
  const existing = await query("SELECT skill_id FROM skills WHERE LOWER(skill_name) = LOWER($1)", [trimmed]);
  if (existing.rows[0]) return existing.rows[0].skill_id;
  const inserted = await query(
    "INSERT INTO skills (skill_name) VALUES ($1) ON CONFLICT (skill_name) DO UPDATE SET skill_name = EXCLUDED.skill_name RETURNING skill_id",
    [trimmed]
  );
  return inserted.rows[0]?.skill_id ?? null;
}

export async function inferSkillsFromJob(job, catalog, { useQwen = false } = {}) {
  const text = `${job.job_title || ""} ${job.description || ""}`.trim();
  const fromCatalog = extractSkillsFromText(text, catalog);
  const fromPhrases = extractPhraseSkills(text);
  let merged = mergeSkillNames(fromCatalog, fromPhrases);

  if (merged.length === 0 && useQwen && text.length > 0) {
    try {
      const prompt = `Extract up to 8 technical skills required for this job posting. Use concise canonical names (e.g. "React", "SQL", "Spring Boot").

Job title: ${job.job_title || ""}
Description: ${job.description || ""}

Return ONLY a JSON array of strings. No explanation.`;
      const raw = await callQwenAPI(prompt, 400);
      const parsed = extractJson(raw, "array");
      if (Array.isArray(parsed)) {
        merged = mergeSkillNames(
          parsed.map((s) => String(s).trim()).filter(Boolean),
          merged
        );
      }
    } catch (error) {
      console.warn(`Qwen skill extract skipped for job ${job.job_id}:`, error.message);
    }
  }

  return merged;
}

export async function syncJobSkillsFromJobData(jobId, skillNames, { replace = false } = {}) {
  const unique = mergeSkillNames(skillNames);
  const skillIds = [];
  for (const name of unique) {
    const skillId = await resolveSkillId(name);
    if (skillId) skillIds.push(skillId);
  }

  if (replace) {
    if (skillIds.length === 0) return { added: 0, removed: 0, skillNames: unique };
    await query(
      `DELETE FROM job_skills
       WHERE job_id = $1 AND skill_id NOT IN (SELECT unnest($2::int[]))`,
      [jobId, skillIds]
    );
  }

  let added = 0;
  for (const skillId of skillIds) {
    const result = await query(
      `INSERT INTO job_skills (job_id, skill_id, is_required)
       VALUES ($1, $2, true)
       ON CONFLICT (job_id, skill_id) DO NOTHING`,
      [jobId, skillId]
    );
    if (result.rowCount > 0) added += 1;
  }

  return { added, skillNames: unique };
}
