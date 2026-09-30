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

const r = await pool.query(`
  SELECT j.job_id, j.job_title, c.company_name,
         COALESCE(json_agg(s.skill_name ORDER BY s.skill_name) FILTER (WHERE s.skill_name IS NOT NULL), '[]') AS skills
  FROM jobs j
  JOIN companies c ON c.company_id = j.company_id
  LEFT JOIN job_skills js ON js.job_id = j.job_id
  LEFT JOIN skills s ON s.skill_id = js.skill_id
  WHERE j.job_title ILIKE '%Software Developer%' AND c.company_name ILIKE '%Tata%'
  GROUP BY j.job_id, j.job_title, c.company_name
`);
console.log(JSON.stringify(r.rows, null, 2));

const failed = await pool.query(`
  SELECT a.application_id, a.best_quiz_score, a.quiz_passed, j.job_title, c.company_name
  FROM applications a
  JOIN jobs j ON j.job_id = a.job_id
  JOIN companies c ON c.company_id = j.company_id
  WHERE a.quiz_status = 'Completed' AND a.quiz_passed = false
  ORDER BY a.applied_at DESC LIMIT 5
`);
console.log("failed apps", JSON.stringify(failed.rows, null, 2));
await pool.end();
