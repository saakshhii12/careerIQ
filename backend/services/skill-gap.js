import { query } from "../db.js";
import { computeJobMatch } from "./matching.js";
import { QUIZ_PASS_THRESHOLD } from "./pipeline.js";

/** Same rule as quiz submit in routes/quiz.js */
export function isQuizFailed(application) {
  return application.quiz_status === "Completed" && application.quiz_passed === false;
}

function parseJson(value, fallback = null) {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/** Recruiter-selected required skills (job_skills → skills). */
export async function getRecruiterRequiredSkills(jobId) {
  const result = await query(
    `SELECT s.skill_name
     FROM job_skills js
     JOIN skills s ON s.skill_id = js.skill_id
     WHERE js.job_id = $1 AND COALESCE(js.is_required, true) = true
     ORDER BY s.skill_name`,
    [jobId]
  );
  return result.rows.map((row) => row.skill_name);
}

export async function assertSkillRequiredForJob(jobId, skillName) {
  const required = await getRecruiterRequiredSkills(jobId);
  const needle = String(skillName || "").trim().toLowerCase();
  if (!needle) {
    const error = new Error("skill is required.");
    error.status = 400;
    throw error;
  }
  if (!required.some((name) => name.toLowerCase() === needle)) {
    const error = new Error("That skill is not required for this job posting.");
    error.status = 400;
    throw error;
  }
}

async function loadLatestResumeParsed(studentId) {
  const resume = await query(
    `SELECT parsed_data FROM resumes WHERE student_id = $1 ORDER BY uploaded_at DESC LIMIT 1`,
    [studentId]
  );
  return parseJson(resume.rows[0]?.parsed_data, {});
}

/**
 * Failed-assessment roadmap: all recruiter required skills get learning resources.
 * Profile/resume match is context only — it does not filter courses.
 */
export async function buildApplicationSkillGap(studentId, applicationRow) {
  if (!isQuizFailed(applicationRow)) {
    return { eligible: false, reason: "quiz_not_failed" };
  }

  const requiredFromJob = await getRecruiterRequiredSkills(applicationRow.job_id);

  let matchedAmongJob = [];
  let missingAmongJob = [];
  if (requiredFromJob.length > 0) {
    const parsedResume = await loadLatestResumeParsed(studentId);
    const matchGap = await computeJobMatch(studentId, applicationRow.job_id, parsedResume);
    const requiredLower = new Set(requiredFromJob.map((s) => s.toLowerCase()));
    missingAmongJob = (matchGap.missingSkills || []).filter((s) =>
      requiredLower.has(String(s).toLowerCase())
    );
    matchedAmongJob = (matchGap.matchedSkills || []).filter((s) =>
      requiredLower.has(String(s).toLowerCase())
    );
  }

  const quizScore =
    applicationRow.best_quiz_score != null ? Math.round(Number(applicationRow.best_quiz_score)) : null;

  return {
    eligible: true,
    applicationId: String(applicationRow.application_id),
    jobId: applicationRow.job_id,
    jobTitle: applicationRow.job_title,
    companyName: applicationRow.company_name || null,
    quizStatus: applicationRow.quiz_status,
    quizPassed: Boolean(applicationRow.quiz_passed),
    quizScore,
    quizPassThreshold: QUIZ_PASS_THRESHOLD,
    assessmentFailed: true,
    noJobSkills: requiredFromJob.length === 0,
    intro:
      "You did not pass the assessment for this role. The learning resources below cover the skills required for this position.",
    skills: requiredFromJob.map((skill) => ({
      skill,
      demonstrated: matchedAmongJob.some((m) => m.toLowerCase() === skill.toLowerCase()),
    })),
    learningSkills: requiredFromJob.map((skill) => ({ skill })),
    matchedSkills: matchedAmongJob,
    missingSkills: missingAmongJob,
  };
}

export async function listFailedQuizSkillGaps(studentId, applicationId = null) {
  const params = [studentId];
  let filter = "";
  if (applicationId) {
    filter = " AND a.application_id = $2";
    params.push(applicationId);
  }

  const result = await query(
    `SELECT a.application_id, a.job_id, a.quiz_status, a.quiz_passed, a.best_quiz_score,
            j.job_title, c.company_name
     FROM applications a
     JOIN jobs j ON j.job_id = a.job_id
     JOIN companies c ON c.company_id = j.company_id
     WHERE a.student_id = $1${filter}
     ORDER BY a.applied_at DESC`,
    params
  );

  const applications = [];
  for (const row of result.rows) {
    const gap = await buildApplicationSkillGap(studentId, row);
    if (gap.eligible) applications.push(gap);
  }
  return applications;
}

export async function assertApplicationQuizFailed(studentId, applicationId) {
  const result = await query(
    `SELECT a.application_id, a.quiz_status, a.quiz_passed, a.job_id, j.job_title
     FROM applications a
     JOIN jobs j ON j.job_id = a.job_id
     WHERE a.application_id = $1 AND a.student_id = $2`,
    [applicationId, studentId]
  );
  if (!result.rows.length) {
    const error = new Error("Application not found.");
    error.status = 404;
    throw error;
  }
  const row = result.rows[0];
  if (!isQuizFailed(row)) {
    const error = new Error(
      "Course recommendations are only available after a failed assessment for this application."
    );
    error.status = 403;
    throw error;
  }
  return row;
}
