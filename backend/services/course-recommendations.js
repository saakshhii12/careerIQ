import { query } from "../db.js";
import { callQwenAPI, extractJson } from "./qwen.js";
import { searchWeb } from "./search-provider.js";

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const TRUSTED_FREE_HINTS = [
  "coursera.org",
  "edx.org",
  "freecodecamp.org",
  "khanacademy.org",
  "developer.mozilla.org",
  "w3schools.com",
  "microsoft.com/learn",
  "google.com/certificates",
  "hyperskill.org",
  "codecademy.com",
];

function buildSearchQuery(skill, targetRole) {
  const rolePart = targetRole ? ` ${targetRole}` : "";
  return `free ${skill} course${rolePart}`;
}

function inferFreeLabel(title, snippet, url) {
  const text = `${title} ${snippet} ${url}`.toLowerCase();
  if (/audit for free|free to audit|free course|100% free|completely free/.test(text)) {
    if (/certificate.*paid|paid certificate|upgrade for certificate/.test(text)) {
      return { label: "FREE_AUDIT", display: "Free to audit — certificate may require payment" };
    }
    return { label: "FREE", display: "Free course" };
  }
  if (/freecodecamp|khan academy|mdn|mozilla developer/.test(text)) {
    return { label: "FREE", display: "Free course" };
  }
  if (/coursera|edx|udacity|udemy|linkedin learning/.test(text)) {
    return { label: "FREE_AUDIT", display: "May be free to audit — verify on provider site" };
  }
  return { label: "UNKNOWN", display: "Verify pricing on provider site" };
}

function inferLevel(snippet, targetRole) {
  const text = snippet.toLowerCase();
  if (/advanced|expert|senior/.test(text)) return "Advanced";
  if (/beginner|introduction|intro to|getting started|fundamentals/.test(text)) return "Beginner";
  if (/intermediate/.test(text)) return "Intermediate";
  return targetRole ? "Intermediate" : "Beginner";
}

async function rankCoursesWithQwen(skill, targetRole, searchResults) {
  if (searchResults.length === 0) return [];

  const catalog = searchResults.slice(0, 10).map((item, index) => ({
    index,
    title: item.title,
    url: item.url,
    snippet: item.snippet,
    source: item.source,
  }));

  const prompt = `You are selecting up to 5 learning resources for a student who needs to learn "${skill}"${
    targetRole ? ` for the role "${targetRole}"` : ""
  }.

You MUST ONLY choose from the SEARCH RESULTS below. Do NOT invent URLs, titles, or providers.

SEARCH RESULTS:
${JSON.stringify(catalog, null, 2)}

Return ONLY valid JSON array (max 5 items) in this format:
[
  {
    "index": <number from search results>,
    "relevanceReason": "<one sentence why this helps for the skill>"
  }
]

Rules:
- Prefer genuinely free or free-to-audit educational content.
- Prefer official or widely recognized learning platforms.
- Skip irrelevant results.
- If nothing is relevant, return [].`;

  try {
    const text = await callQwenAPI(prompt, 700);
    const picks = extractJson(text, "array");
    if (!Array.isArray(picks)) return [];
    const courses = [];
    for (const pick of picks.slice(0, 5)) {
      const idx = Number(pick.index);
      const hit = catalog.find((item) => item.index === idx);
      if (!hit) continue;
      const free = inferFreeLabel(hit.title, hit.snippet, hit.url);
      courses.push({
        title: hit.title,
        provider: hit.source,
        url: hit.url,
        description: hit.snippet.slice(0, 280),
        level: inferLevel(hit.snippet, targetRole),
        freeStatus: free.label,
        freeStatusLabel: free.display,
        relevanceReason: String(pick.relevanceReason || "").slice(0, 240),
      });
    }
    return courses;
  } catch (error) {
    console.warn("Qwen course ranking failed, using search order:", error.message);
    return searchResults.slice(0, 5).map((hit) => {
      const free = inferFreeLabel(hit.title, hit.snippet, hit.url);
      return {
        title: hit.title,
        provider: hit.source,
        url: hit.url,
        description: hit.snippet.slice(0, 280),
        level: inferLevel(hit.snippet, targetRole),
        freeStatus: free.label,
        freeStatusLabel: free.display,
        relevanceReason: `Covers ${skill} based on search relevance.`,
      };
    });
  }
}

async function readCache(studentId, skillName, { applicationId, jobId }) {
  const result = await query(
    `SELECT courses, searched_at FROM student_skill_course_cache
     WHERE student_id = $1 AND skill_name = $2
       AND COALESCE(application_id, -1) = COALESCE($3::int, -1)
     ORDER BY searched_at DESC
     LIMIT 1`,
    [studentId, skillName, applicationId ?? null]
  );
  const row = result.rows[0];
  if (!row) return null;
  const age = Date.now() - new Date(row.searched_at).getTime();
  if (age > CACHE_TTL_MS) return null;
  return row.courses;
}

async function writeCache(studentId, skillName, { applicationId, jobId }, courses) {
  await query(
    `DELETE FROM student_skill_course_cache
     WHERE student_id = $1 AND skill_name = $2
       AND COALESCE(application_id, -1) = COALESCE($3::int, -1)`,
    [studentId, skillName, applicationId ?? null]
  );
  await query(
    `INSERT INTO student_skill_course_cache (student_id, skill_name, job_id, application_id, courses, searched_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, CURRENT_TIMESTAMP)`,
    [studentId, skillName, jobId ?? null, applicationId ?? null, JSON.stringify(courses)]
  );
}

export async function getCourseRecommendationsForSkill({
  studentId,
  skillName,
  targetRole,
  jobId,
  applicationId,
  refresh = false,
}) {
  const skill = String(skillName || "").trim();
  if (!skill) {
    throw Object.assign(new Error("skill is required."), { status: 400 });
  }

  const cacheKey = { applicationId: applicationId ?? null, jobId: jobId ?? null };

  if (!refresh) {
    const cached = await readCache(studentId, skill, cacheKey);
    if (cached) return { courses: cached, cached: true, skill };
  }

  const queryText = buildSearchQuery(skill, targetRole);
  const searchResults = await searchWeb(queryText, { num: 10 });
  const courses = await rankCoursesWithQwen(skill, targetRole, searchResults);
  await writeCache(studentId, skill, cacheKey, courses);
  return { courses, cached: false, skill, searchQuery: queryText };
}
