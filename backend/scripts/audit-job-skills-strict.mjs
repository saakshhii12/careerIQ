/**
 * Read-only audit: existing job_skills vs skills supported by job DESCRIPTION only.
 * Does not use job title for inference. No writes.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import {
  extractPhraseSkills,
  extractSkillsFromText,
  getSkillCatalog,
  mergeSkillNames,
  normalizeSkill,
} from "../services/job-skill-extraction.js";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, "..", ".env") });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase") ? { rejectUnauthorized: false } : undefined,
});

function skillsSupportedByDescription(description, catalog) {
  const desc = String(description || "").trim();
  if (!desc) return [];
  return mergeSkillNames(extractSkillsFromText(desc, catalog), extractPhraseSkills(desc));
}

const catalog = await getSkillCatalog();
const skillsBefore = catalog.length;

const jobs = await pool.query(`
  SELECT j.job_id, j.job_title, j.description, c.company_name,
         COALESCE(
           (SELECT array_agg(s.skill_name ORDER BY s.skill_name)
            FROM job_skills js
            JOIN skills s ON s.skill_id = js.skill_id
            WHERE js.job_id = j.job_id AND COALESCE(js.is_required, true) = true),
           ARRAY[]::text[]
         ) AS existing_skills
  FROM jobs j
  JOIN companies c ON c.company_id = j.company_id
  ORDER BY j.job_id
`);

const jsCount = await pool.query("SELECT COUNT(*)::int AS n FROM job_skills");

let complete = 0;
let needsLinks = 0;
let hasExtra = 0;
let noDescriptionSupport = 0;
const newSkillsNeeded = new Set();
const newLinksNeeded = [];

console.log("=== STRICT AUDIT (description-only skill inference) ===\n");
console.log(`TOTAL JOBS: ${jobs.rows.length}`);
console.log(`Existing skills (catalog): ${skillsBefore}`);
console.log(`Existing job_skills rows: ${jsCount.rows[0].n}\n`);

for (const job of jobs.rows) {
  const existing = job.existing_skills || [];
  const supported = skillsSupportedByDescription(job.description, catalog);
  const existingLower = new Set(existing.map((s) => normalizeSkill(s)));
  const supportedLower = new Set(supported.map((s) => normalizeSkill(s)));

  const missing = supported.filter((s) => !existingLower.has(normalizeSkill(s)));
  const extra = existing.filter((s) => !supportedLower.has(normalizeSkill(s)));

  for (const s of missing) {
    const inCatalog = catalog.some((c) => normalizeSkill(c.skill_name) === normalizeSkill(s));
    if (!inCatalog) newSkillsNeeded.add(s);
    newLinksNeeded.push({ job_id: job.job_id, skill: s });
  }

  const isComplete = missing.length === 0 && extra.length === 0;
  if (isComplete && supported.length > 0) complete += 1;
  else if (missing.length > 0) needsLinks += 1;
  if (extra.length > 0) hasExtra += 1;
  if (supported.length === 0) noDescriptionSupport += 1;

  console.log("---");
  console.log(`Job #${job.job_id}: ${job.job_title}`);
  console.log(`Company: ${job.company_name}`);
  console.log(`Description: ${(job.description || "").replace(/\s+/g, " ").slice(0, 200)}`);
  console.log(`Existing job_skills: ${existing.length ? existing.join(", ") : "(none)"}`);
  console.log(
    `Description-supported skills: ${supported.length ? supported.join(", ") : "(none detected)"}`
  );
  if (missing.length) {
    console.log(`Missing relationships to add: ${missing.join(", ")}`);
  } else {
    console.log("Missing relationships to add: (none)");
  }
  if (extra.length) {
    console.log(`Linked but NOT in description (review): ${extra.join(", ")}`);
  }
}

console.log("\n=== SUMMARY ===");
console.log(`Jobs with complete mapping (desc-supported = linked, no extras): ${complete}`);
console.log(`Jobs needing new job_skills links: ${needsLinks}`);
console.log(`Jobs with extra links not in description: ${hasExtra}`);
console.log(`Jobs with no description-supported skills: ${noDescriptionSupport}`);
console.log(`New skill names needed (not in catalog): ${newSkillsNeeded.size}`);
if (newSkillsNeeded.size) console.log([...newSkillsNeeded].join(", "));
console.log(`New job_skills relationships needed: ${newLinksNeeded.length}`);

await pool.end();
