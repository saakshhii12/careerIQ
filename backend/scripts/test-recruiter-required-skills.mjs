/**
 * API test: recruiter creates job with required skills → job_skills persisted.
 * Does not modify application 52 or TCS job description.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, "..", ".env") });
const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase") ? { rejectUnauthorized: false } : undefined,
});

async function api(pathname, { method = "GET", token, body } = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, body: json };
}

const studentBefore = await pool.query("SELECT COUNT(*)::int n FROM student_skills");
const descBefore = await pool.query("SELECT description FROM jobs WHERE job_id = 1");

const recruiter = await pool.query(
  `SELECT u.email FROM users u JOIN recruiters r ON r.user_id = u.user_id LIMIT 1`
);
if (!recruiter.rows[0]?.email) {
  console.log("No recruiter user — skip API test");
  await pool.end();
  process.exit(0);
}

const login = await api("/api/auth/login", {
  method: "POST",
  body: { email: recruiter.rows[0].email, password: process.env.TEST_RECRUITER_PASSWORD || "E2ePassw0rd!" },
});
if (!login.body.token) {
  console.log("Recruiter login failed", login.status, login.body);
  await pool.end();
  process.exit(1);
}
const token = login.body.token;

const catalog = await api("/api/recruiters/skills", { token });
console.log("GET /recruiters/skills", catalog.status, catalog.body.skills?.length, "skills");

const create = await api("/api/recruiters/me/jobs", {
  method: "POST",
  token,
  body: {
    title: `Roadmap Skills Test ${Date.now()}`,
    department: "QA",
    location: "Remote",
    experienceLevel: "1 year",
    workMode: "remote",
    employmentType: "full_time",
    description: "API validation only — minimal description.",
    requiredSkills: ["Python", "SQL", "Git"],
    preferredSkills: [],
    responsibilities: [],
    openings: 1,
  },
});
console.log("POST job", create.status);
if (create.status !== 201) {
  console.log(create.body);
  await pool.end();
  process.exit(1);
}

const jobId = create.body.id;
const links = await pool.query(
  `SELECT s.skill_name FROM job_skills js JOIN skills s ON s.skill_id = js.skill_id WHERE js.job_id = $1 ORDER BY 1`,
  [jobId]
);
console.log("job_skills", links.rows.map((r) => r.skill_name));

const studentAfter = await pool.query("SELECT COUNT(*)::int n FROM student_skills");
const descAfter = await pool.query("SELECT description FROM jobs WHERE job_id = 1");

console.log("student_skills unchanged", studentBefore.rows[0].n === studentAfter.rows[0].n);
console.log("TCS job description unchanged", descBefore.rows[0].description === descAfter.rows[0].description);

await pool.query("DELETE FROM job_skills WHERE job_id = $1", [jobId]);
await pool.query("DELETE FROM jobs WHERE job_id = $1", [jobId]);

await pool.end();
console.log("OK — cleaned up test job");
