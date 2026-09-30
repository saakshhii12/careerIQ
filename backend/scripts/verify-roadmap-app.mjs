/** Verify roadmap payload for application 52 (TCS Software Developer). */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import { buildApplicationSkillGap } from "../services/skill-gap.js";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, "..", ".env") });
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase") ? { rejectUnauthorized: false } : undefined,
});

const app = await pool.query(
  `SELECT a.application_id, a.student_id, a.job_id, a.quiz_status, a.quiz_passed, a.best_quiz_score,
          j.job_title, c.company_name
   FROM applications a
   JOIN jobs j ON j.job_id = a.job_id
   JOIN companies c ON c.company_id = j.company_id
   WHERE a.application_id = 52`
);
if (!app.rows.length) {
  console.log("Application 52 not found");
  await pool.end();
  process.exit(0);
}
const row = app.rows[0];
const gap = await buildApplicationSkillGap(row.student_id, row);
console.log(JSON.stringify(gap, null, 2));
await pool.end();
