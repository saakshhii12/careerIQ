/**
 * Read-only audit: jobs, skills, job_skills relationships.
 * Usage: node scripts/audit-job-skills.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, "..", ".env") });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase") ? { rejectUnauthorized: false } : undefined,
});

const jobs = await pool.query(`
  SELECT j.job_id, j.job_title, j.description, c.company_name,
         COALESCE(
           (SELECT json_agg(s.skill_name ORDER BY s.skill_name)
            FROM job_skills js JOIN skills s ON s.skill_id = js.skill_id
            WHERE js.job_id = j.job_id), '[]'::json
         ) AS linked_skills
  FROM jobs j
  JOIN companies c ON c.company_id = j.company_id
  ORDER BY j.job_id
`);

const skillCount = await pool.query("SELECT COUNT(*)::int AS n FROM skills");
const jsCount = await pool.query("SELECT COUNT(*)::int AS n FROM job_skills");

const dupSkills = await pool.query(`
  SELECT LOWER(TRIM(skill_name)) AS key, COUNT(*)::int AS cnt, array_agg(skill_name) AS names
  FROM skills
  GROUP BY LOWER(TRIM(skill_name))
  HAVING COUNT(*) > 1
`);

const dupJobSkills = await pool.query(`
  SELECT job_id, skill_id, COUNT(*)::int AS cnt
  FROM job_skills
  GROUP BY job_id, skill_id
  HAVING COUNT(*) > 1
`);

const orphanJs = await pool.query(`
  SELECT js.job_id, js.skill_id
  FROM job_skills js
  LEFT JOIN jobs j ON j.job_id = js.job_id
  LEFT JOIN skills s ON s.skill_id = js.skill_id
  WHERE j.job_id IS NULL OR s.skill_id IS NULL
`);

const allSkills = await pool.query("SELECT skill_id, skill_name, category FROM skills ORDER BY skill_name");

console.log("=== SUMMARY ===");
console.log("Jobs:", jobs.rows.length);
console.log("Skills:", skillCount.rows[0].n);
console.log("job_skills rows:", jsCount.rows[0].n);
console.log(
  "Jobs WITH skills:",
  jobs.rows.filter((j) => Array.isArray(j.linked_skills) && j.linked_skills.length > 0).length
);
console.log(
  "Jobs WITHOUT skills:",
  jobs.rows.filter((j) => !Array.isArray(j.linked_skills) || j.linked_skills.length === 0).length
);
console.log("Duplicate skill names (case-insensitive):", dupSkills.rows.length);
console.log("Duplicate job_skills pairs:", dupJobSkills.rows.length);
console.log("Orphan job_skills:", orphanJs.rows.length);

console.log("\n=== ALL SKILLS ===");
for (const s of allSkills.rows) console.log(`  ${s.skill_id}\t${s.skill_name}\t${s.category ?? ""}`);

console.log("\n=== JOBS ===");
for (const j of jobs.rows) {
  const skills = j.linked_skills || [];
  const desc = (j.description || "").replace(/\s+/g, " ").slice(0, 120);
  console.log(`\n#${j.job_id} ${j.job_title} @ ${j.company_name}`);
  console.log(`  desc: ${desc || "(empty)"}`);
  console.log(`  skills (${skills.length}):`, skills.length ? skills.join(", ") : "(none)");
}

const tcs = jobs.rows.filter(
  (j) =>
    String(j.job_title || "").toLowerCase().includes("software developer") &&
    String(j.company_name || "").toLowerCase().includes("tata")
);
console.log("\n=== TCS SOFTWARE DEVELOPER ===");
console.log(JSON.stringify(tcs, null, 2));

await pool.end();
