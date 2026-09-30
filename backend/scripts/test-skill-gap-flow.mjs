/**
 * E2E: register → apply → fail quiz → skill-gaps → skill-courses (Serper).
 * Usage: node scripts/test-skill-gap-flow.mjs [--keep]
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, "..", ".env") });

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
const KEEP = process.argv.includes("--keep");
const STAMP = Date.now();
const EMAIL = `skillgap.${STAMP}@careeriq.test`;
const PASSWORD = "E2ePassw0rd!";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase") ? { rejectUnauthorized: false } : undefined,
});

function ok(label, cond, extra) {
  console.log(cond ? `  OK   ${label}` : `  FAIL ${label}${extra ? " " + JSON.stringify(extra) : ""}`);
  return cond;
}

async function api(pathname, { method = "GET", token, body, raw } = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: {
      ...(raw ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { status: res.status, body: json };
}

let allOk = true;
const assert = (label, cond, extra) => {
  if (!ok(label, cond, extra)) allOk = false;
};

try {
  const health = await api("/api/health");
  assert("backend health", health.status === 200);

  const register = await api("/api/auth/register", {
    method: "POST",
    body: {
      fullName: "Skill Gap Test",
      email: EMAIL,
      password: PASSWORD,
      role: "student",
      collegeName: "CareerIQ Institute",
      degree: "B.Tech",
      specialization: "CS",
      graduationYear: 2027,
      city: "Pune",
    },
  });
  assert("register", register.status === 201, register.body);
  const token = register.body.token;
  const studentId = register.body.user?.profile?.student_id;

  const uploadsDir = path.join(here, "..", "uploads", "resumes");
  const sampleFiles = await fs.readdir(uploadsDir).catch(() => []);
  const samplePdf = sampleFiles.find((name) => name.toLowerCase().endsWith(".pdf"));
  if (samplePdf) {
    const pdfBytes = await fs.readFile(path.join(uploadsDir, samplePdf));
    const form = new FormData();
    form.append("resume", new Blob([pdfBytes], { type: "application/pdf" }), "skillgap-resume.pdf");
    form.append(
      "extractedText",
      "Skills: JavaScript, React, HTML, CSS, Git\nEducation: B.Tech CS\n"
    );
    const upload = await api("/api/candidate/resume", { method: "POST", token, raw: form });
    assert("resume upload", upload.status === 200, upload.body);
  } else {
    console.log("  WARN no sample PDF for resume upload");
  }

  const jobs = await api("/api/candidate/jobs", { token });
  const job = jobs.body.jobs?.[0];
  assert("job available", Boolean(job));

  const apply = await api("/api/applications", {
    method: "POST",
    token,
    body: { jobId: job.job_id },
  });
  assert("apply", apply.status === 201, apply.body);
  const applicationId = apply.body.application?.application_id;
  const jobId = job.job_id;

  for (const skillName of ["Python", "JavaScript", "React", "SQL", "Git"]) {
    const skillRow = await pool.query(
      "INSERT INTO skills (skill_name) VALUES ($1) ON CONFLICT (skill_name) DO NOTHING RETURNING skill_id",
      [skillName]
    );
    let skillId = skillRow.rows[0]?.skill_id;
    if (!skillId) {
      const existing = await pool.query("SELECT skill_id FROM skills WHERE LOWER(skill_name) = LOWER($1)", [
        skillName,
      ]);
      skillId = existing.rows[0]?.skill_id;
    }
    if (skillId) {
      await pool.query(
        `INSERT INTO job_skills (job_id, skill_id, is_required)
         VALUES ($1, $2, true)
         ON CONFLICT DO NOTHING`,
        [jobId, skillId]
      );
    }
  }

  const quizStart = await api("/api/quiz/start", {
    method: "POST",
    token,
    body: { applicationId },
  });
  assert("quiz start", quizStart.status === 201, quizStart.body);
  const attemptId = quizStart.body.attemptId;
  const questions = quizStart.body.questions || [];

  const wrongAnswers = questions.map((q) => ({
    questionId: q.questionId,
    selectedOptionIndex: 0,
  }));

  const submit = await api("/api/quiz/submit", {
    method: "POST",
    token,
    body: { attemptId, answers: wrongAnswers },
  });
  assert("quiz submit", submit.status === 200, submit.body);
  assert("quiz failed", submit.body.passed === false && submit.body.score < 60, submit.body);

  const gaps = await api("/api/candidate/skill-gaps", { token });
  assert("skill-gaps 200", gaps.status === 200, gaps.body);
  assert("skill-gaps has applications array", Array.isArray(gaps.body.applications), gaps.body);
  assert(
    "skill-gaps includes this application",
    gaps.body.applications?.some((a) => String(a.applicationId) === String(applicationId)),
    gaps.body.applications
  );

  const entry = gaps.body.applications?.find((a) => String(a.applicationId) === String(applicationId));
  assert("roadmap lists recruiter job skills", (entry?.skills?.length ?? 0) >= 3, entry?.skills);

  if (entry && entry.skills?.length) {
    const skill = entry.skills[0].skill;
    const courses = await api(
      `/api/candidate/skill-courses?skill=${encodeURIComponent(skill)}&applicationId=${applicationId}`,
      { token }
    );
    assert("skill-courses 200", courses.status === 200, courses.body);
    assert("courses from search", Array.isArray(courses.body.courses), courses.body);
    if (courses.body.courses?.length) {
      assert("course has url", Boolean(courses.body.courses[0].url), courses.body.courses[0]);
      console.log("  sample course:", courses.body.courses[0].title, courses.body.courses[0].url);
    } else {
      console.log("  WARN no courses returned (Serper/Qwen may have filtered all)");
    }
  } else {
    console.log("  INFO gapUndetermined or no skills — courses step skipped");
  }

  const passedApp = await pool.query(
    "SELECT quiz_passed, best_quiz_score FROM applications WHERE application_id = $1",
    [applicationId]
  );
  assert("DB quiz_passed false", passedApp.rows[0]?.quiz_passed === false, passedApp.rows[0]);

  if (!KEEP) {
    await pool.query("DELETE FROM applications WHERE application_id = $1", [applicationId]);
    await pool.query("DELETE FROM students WHERE student_id = $1", [studentId]);
    await pool.query("DELETE FROM users WHERE email = $1", [EMAIL]);
  } else {
    console.log(`Kept user ${EMAIL} password ${PASSWORD} application ${applicationId}`);
  }
} catch (e) {
  console.error("Fatal:", e.message);
  allOk = false;
} finally {
  await pool.end();
}

process.exit(allOk ? 0 : 1);
