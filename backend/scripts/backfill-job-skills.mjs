/**
 * Idempotent backfill: link jobs → skills from title/description (no title-specific hardcoding).
 *
 * Usage:
 *   node scripts/backfill-job-skills.mjs              # only jobs with zero job_skills
 *   node scripts/backfill-job-skills.mjs --sync       # align all jobs to inferred skills (removes stray links)
 *   node scripts/backfill-job-skills.mjs --sync --qwen # use Qwen when inference is empty
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import {
  getSkillCatalog,
  inferSkillsFromJob,
  syncJobSkillsFromJobData,
} from "../services/job-skill-extraction.js";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, "..", ".env") });

const SYNC = process.argv.includes("--sync");
const USE_QWEN = process.argv.includes("--qwen");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase") ? { rejectUnauthorized: false } : undefined,
});

const jobs = await pool.query(`
  SELECT j.job_id, j.job_title, j.description,
         COUNT(js.skill_id)::int AS skill_count
  FROM jobs j
  LEFT JOIN job_skills js ON js.job_id = j.job_id
  GROUP BY j.job_id, j.job_title, j.description
  ORDER BY j.job_id
`);

const catalog = await getSkillCatalog();
let newSkillsBefore = catalog.length;
const stats = {
  jobsProcessed: 0,
  jobsUpdated: 0,
  linksAdded: 0,
  jobsSkipped: 0,
};

for (const job of jobs.rows) {
  if (!SYNC && job.skill_count > 0) {
    stats.jobsSkipped += 1;
    continue;
  }

  stats.jobsProcessed += 1;
  const inferred = await inferSkillsFromJob(job, catalog, { useQwen: USE_QWEN });
  if (inferred.length === 0) {
    console.log(`  skip job #${job.job_id} (${job.job_title}): no skills inferred from text`);
    continue;
  }

  const result = await syncJobSkillsFromJobData(job.job_id, inferred, { replace: SYNC });
  if (result.added > 0 || SYNC) {
    stats.jobsUpdated += 1;
    stats.linksAdded += result.added;
    console.log(
      `  job #${job.job_id} ${job.job_title}: ${result.skillNames.join(", ")}${SYNC ? " (synced)" : ""}`
    );
  }
}

const skillCountAfter = await pool.query("SELECT COUNT(*)::int AS n FROM skills");
const jsCount = await pool.query("SELECT COUNT(*)::int AS n FROM job_skills");

console.log("\n=== BACKFILL SUMMARY ===");
console.log(JSON.stringify(stats, null, 2));
console.log("Skills in catalog:", newSkillsBefore, "→", skillCountAfter.rows[0].n);
console.log("job_skills rows:", jsCount.rows[0].n);

await pool.end();
