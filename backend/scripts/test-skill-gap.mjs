/**
 * Smoke test: skill-gaps + skill-courses for a real failed-quiz application.
 * Usage: node scripts/test-skill-gap.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, "..", ".env") });

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
const databaseUrl = process.env.DATABASE_URL;
const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl?.includes("supabase") ? { rejectUnauthorized: false } : undefined,
});

async function api(pathname, { token, method = "GET", body: payload } = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: payload ?? undefined,
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

const failed = await pool.query(
  `SELECT a.application_id, a.student_id, a.best_quiz_score, j.job_title, u.email
   FROM applications a
   JOIN jobs j ON j.job_id = a.job_id
   JOIN students s ON s.student_id = a.student_id
   JOIN users u ON u.user_id = s.user_id
   WHERE a.quiz_status = 'Completed' AND a.quiz_passed = false
   ORDER BY a.applied_at DESC
   LIMIT 1`
);

if (!failed.rows.length) {
  console.log("No failed-quiz application in DB — run e2e-test with failing quiz first.");
  await pool.end();
  process.exit(0);
}

const row = failed.rows[0];
console.log("Using application", row.application_id, row.job_title, "score", row.best_quiz_score);

const login = await api("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({
    email: row.email,
    password: process.env.TEST_STUDENT_PASSWORD || "E2ePassw0rd!",
  }),
});
// Try without password env — skip login if not set
let token = login.body?.token;
if (!token) {
  console.log("Login failed (set TEST_STUDENT_PASSWORD for", row.email, "to run authenticated test).");
  console.log("Login status:", login.status, login.body);
  await pool.end();
  process.exit(1);
}

const gaps = await api(`/api/candidate/skill-gaps`, { token });
console.log("skill-gaps status", gaps.status);
console.log(JSON.stringify(gaps.body, null, 2));

const appEntry = gaps.body?.applications?.find(
  (a) => String(a.applicationId) === String(row.application_id)
);
if (!appEntry) {
  console.log("FAIL: expected application in skill-gaps response");
  await pool.end();
  process.exit(1);
}

const skill = appEntry.skills?.[0]?.skill;
if (!skill) {
  console.log("No skills on gap (gapUndetermined may be true) — skipping skill-courses");
  await pool.end();
  process.exit(0);
}

const courses = await api(
  `/api/candidate/skill-courses?skill=${encodeURIComponent(skill)}&applicationId=${row.application_id}`,
  { token }
);
console.log("skill-courses status", courses.status);
console.log("courses count", courses.body?.courses?.length);
if (courses.status === 200 && courses.body?.courses?.length) {
  console.log("first course url", courses.body.courses[0].url);
}
await pool.end();
