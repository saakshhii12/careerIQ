/**
 * Automated test suite for Course Recommendation Eligibility logic.
 *
 * Requirements covered:
 * 1. Quiz failed: recommendations are allowed.
 * 2. Quiz passed but interview failed below 60%: recommendations are allowed.
 * 3. Both assessments passed: recommendations are denied (403).
 * 4. Assessment incomplete or no qualifying failure: recommendations are denied (403).
 * 5. Application not found or belonging to another student: access is denied (404).
 * 6. Verify interview evaluation data retrieval and safe handling of applications with no completed interview.
 *
 * Usage: node scripts/test-course-recommendation-eligibility.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import {
  assertApplicationQuizFailed,
  assertApplicationAssessmentFailed,
  isQuizFailed,
  isInterviewFailed,
} from "../services/skill-gap.js";
import { QUIZ_PASS_THRESHOLD, INTERVIEW_PASS_THRESHOLD } from "../services/pipeline.js";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, "..", ".env") });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase") ? { rejectUnauthorized: false } : undefined,
});

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function check(label, condition, details = "") {
  totalTests += 1;
  if (condition) {
    passedTests += 1;
    console.log(`  PASS: ${label}`);
  } else {
    failedTests += 1;
    console.error(`  FAIL: ${label} ${details ? "- " + details : ""}`);
  }
}

const createdUserIds = [];
const createdStudentIds = [];
const createdAppIds = [];
const createdSessionIds = [];

async function createStudent(tag) {
  const email = `test.${tag}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@careeriq.test`;
  const u = await pool.query(
    "INSERT INTO users (email, password, full_name, role) VALUES ($1, 'hash', $2, 'student') RETURNING user_id",
    [email, `Student ${tag}`]
  );
  createdUserIds.push(u.rows[0].user_id);

  const s = await pool.query(
    "INSERT INTO students (user_id, college_name, degree, graduation_year) VALUES ($1, 'Test College', 'B.Tech', 2026) RETURNING student_id",
    [u.rows[0].user_id]
  );
  createdStudentIds.push(s.rows[0].student_id);
  return s.rows[0].student_id;
}

try {
  console.log("\n=======================================================");
  console.log("Course Recommendation Eligibility Test Suite");
  console.log("=======================================================\n");

  const jobsRes = await pool.query("SELECT job_id, job_title FROM jobs LIMIT 1");
  if (!jobsRes.rows.length) {
    throw new Error("No jobs found in database to associate test applications with.");
  }
  const testJobId = jobsRes.rows[0].job_id;
  const testJobTitle = jobsRes.rows[0].job_title;
  console.log(`Using Job ID: ${testJobId} ("${testJobTitle}") for tests.\n`);

  // -------------------------------------------------------------------------
  // TEST 1: Quiz failed (quiz_status = 'Completed', quiz_passed = false)
  // Expected: Course recommendations ALLOWED. Returns row with job_id and job_title.
  // -------------------------------------------------------------------------
  console.log("Scenario 1: Quiz Failed");
  const s1 = await createStudent("quiz_fail");
  const app1 = await pool.query(
    `INSERT INTO applications (student_id, job_id, status, quiz_status, quiz_passed, best_quiz_score)
     VALUES ($1, $2, 'Rejected', 'Completed', false, 30) RETURNING application_id`,
    [s1, testJobId]
  );
  const appId1 = app1.rows[0].application_id;
  createdAppIds.push(appId1);

  const res1 = await assertApplicationQuizFailed(s1, appId1);
  check("Quiz failed -> allowed", Boolean(res1 && res1.application_id === appId1));
  check("Quiz failed -> job_id returned correctly", res1.job_id === testJobId);
  check("Quiz failed -> job_title returned correctly", res1.job_title === testJobTitle);
  check("Quiz failed -> isQuizFailed returns true", isQuizFailed(res1) === true);

  // -------------------------------------------------------------------------
  // TEST 2: Quiz passed (80%) but interview failed below 60% (score 45, status 'Rejected')
  // Expected: Course recommendations ALLOWED. Returns row with job_id and job_title.
  // -------------------------------------------------------------------------
  console.log("\nScenario 2: Quiz Passed (80%) + Interview Failed (< 60%)");
  const s2 = await createStudent("interview_fail");
  const app2 = await pool.query(
    `INSERT INTO applications (student_id, job_id, status, quiz_status, quiz_passed, best_quiz_score)
     VALUES ($1, $2, 'Rejected', 'Completed', true, 80) RETURNING application_id`,
    [s2, testJobId]
  );
  const appId2 = app2.rows[0].application_id;
  createdAppIds.push(appId2);

  const sess2 = await pool.query(
    `INSERT INTO interview_sessions (application_id, status, overall_score, feedback)
     VALUES ($1, 'Completed', 45, 'Technical depth in core areas needs improvement.') RETURNING session_id`,
    [appId2]
  );
  const sessionId2 = sess2.rows[0].session_id;
  createdSessionIds.push(sessionId2);

  await pool.query(
    `INSERT INTO interview_evaluation (session_id, overall_score, overall_feedback)
     VALUES ($1, 45, 'Evaluation confirmed below threshold')`,
    [sessionId2]
  );

  const res2 = await assertApplicationQuizFailed(s2, appId2);
  check("Interview failed -> allowed", Boolean(res2 && res2.application_id === appId2));
  check("Interview failed -> interview_score retrieved as 45", Number(res2.interview_score) === 45);
  check("Interview failed -> isInterviewFailed returns true", isInterviewFailed(res2) === true);
  check("Interview failed -> isQuizFailed returns false", isQuizFailed(res2) === false);
  check("Interview failed -> alias assertApplicationAssessmentFailed matches assertApplicationQuizFailed",
    assertApplicationAssessmentFailed === assertApplicationQuizFailed
  );

  // -------------------------------------------------------------------------
  // TEST 3: Both assessments passed (Quiz passed 80%, Interview passed 85%, Shortlisted)
  // Expected: Course recommendations DENIED (403).
  // -------------------------------------------------------------------------
  console.log("\nScenario 3: Both Assessments Passed");
  const s3 = await createStudent("both_pass");
  const app3 = await pool.query(
    `INSERT INTO applications (student_id, job_id, status, quiz_status, quiz_passed, best_quiz_score)
     VALUES ($1, $2, 'Shortlisted', 'Completed', true, 80) RETURNING application_id`,
    [s3, testJobId]
  );
  const appId3 = app3.rows[0].application_id;
  createdAppIds.push(appId3);

  const sess3 = await pool.query(
    `INSERT INTO interview_sessions (application_id, status, overall_score, feedback)
     VALUES ($1, 'Completed', 85, 'Solid responses.') RETURNING session_id`,
    [appId3]
  );
  const sessionId3 = sess3.rows[0].session_id;
  createdSessionIds.push(sessionId3);

  await pool.query(
    `INSERT INTO interview_evaluation (session_id, overall_score, overall_feedback)
     VALUES ($1, 85, 'Good performance')`,
    [sessionId3]
  );

  let err3 = null;
  try {
    await assertApplicationQuizFailed(s3, appId3);
  } catch (e) {
    err3 = e;
  }
  check("Both passed -> denied with 403", err3?.status === 403);
  check(
    "Both passed -> correct error message",
    err3?.message === "Course recommendations are only available after a failed assessment for this application."
  );

  // -------------------------------------------------------------------------
  // TEST 4: Assessment incomplete / no qualifying failure
  // Sub-case 4a: Quiz in progress / not completed
  // Sub-case 4b: Quiz passed (80%), interview scheduled / in progress (not completed)
  // Expected: Course recommendations DENIED (403).
  // -------------------------------------------------------------------------
  console.log("\nScenario 4: Assessment Incomplete / No Qualifying Failure");
  const s4a = await createStudent("quiz_in_progress");
  const app4a = await pool.query(
    `INSERT INTO applications (student_id, job_id, status, quiz_status, quiz_passed)
     VALUES ($1, $2, 'Applied', 'In Progress', null) RETURNING application_id`,
    [s4a, testJobId]
  );
  const appId4a = app4a.rows[0].application_id;
  createdAppIds.push(appId4a);

  let err4a = null;
  try {
    await assertApplicationQuizFailed(s4a, appId4a);
  } catch (e) {
    err4a = e;
  }
  check("Quiz in progress -> denied with 403", err4a?.status === 403);

  const s4b = await createStudent("interview_in_progress");
  const app4b = await pool.query(
    `INSERT INTO applications (student_id, job_id, status, quiz_status, quiz_passed, best_quiz_score)
     VALUES ($1, $2, 'Interview Scheduled', 'Completed', true, 80) RETURNING application_id`,
    [s4b, testJobId]
  );
  const appId4b = app4b.rows[0].application_id;
  createdAppIds.push(appId4b);

  const sess4b = await pool.query(
    `INSERT INTO interview_sessions (application_id, status)
     VALUES ($1, 'Scheduled') RETURNING session_id`,
    [appId4b]
  );
  createdSessionIds.push(sess4b.rows[0].session_id);

  let err4b = null;
  try {
    await assertApplicationQuizFailed(s4b, appId4b);
  } catch (e) {
    err4b = e;
  }
  check("Interview not completed -> denied with 403", err4b?.status === 403);

  // -------------------------------------------------------------------------
  // TEST 5: Application not found or belonging to another student
  // Expected: Access DENIED (404).
  // -------------------------------------------------------------------------
  console.log("\nScenario 5: Application Not Found / Different Student");
  let err5NonExistent = null;
  try {
    await assertApplicationQuizFailed(s1, 999999999);
  } catch (e) {
    err5NonExistent = e;
  }
  check("Non-existent application -> 404", err5NonExistent?.status === 404);
  check("Non-existent application -> 'Application not found.'", err5NonExistent?.message === "Application not found.");

  const s5Other = await createStudent("other_student");
  let err5OtherStudent = null;
  try {
    await assertApplicationQuizFailed(s5Other, appId1);
  } catch (e) {
    err5OtherStudent = e;
  }
  check("Different student accessing application -> 404", err5OtherStudent?.status === 404);
  check("Different student -> 'Application not found.'", err5OtherStudent?.message === "Application not found.");

  // -------------------------------------------------------------------------
  // TEST 6: Verify Interview Evaluation data retrieval & fallback handling
  // Sub-case 6a: Score in interview_evaluation overrides/coalesces session score
  // Sub-case 6b: Application with NO interview session produces null values safely
  // -------------------------------------------------------------------------
  console.log("\nScenario 6: Lateral Join & Safe Coalesce Evaluation");
  const s6 = await createStudent("coalesce_eval");
  const app6 = await pool.query(
    `INSERT INTO applications (student_id, job_id, status, quiz_status, quiz_passed, best_quiz_score)
     VALUES ($1, $2, 'Rejected', 'Completed', true, 75) RETURNING application_id`,
    [s6, testJobId]
  );
  const appId6 = app6.rows[0].application_id;
  createdAppIds.push(appId6);

  // Session has overall_score = null, evaluation has overall_score = 52
  const sess6 = await pool.query(
    `INSERT INTO interview_sessions (application_id, status, overall_score)
     VALUES ($1, 'Completed', null) RETURNING session_id`,
    [appId6]
  );
  const sessionId6 = sess6.rows[0].session_id;
  createdSessionIds.push(sessionId6);

  await pool.query(
    `INSERT INTO interview_evaluation (session_id, overall_score, overall_feedback)
     VALUES ($1, 52, 'COALESCE test')`,
    [sessionId6]
  );

  const res6 = await assertApplicationQuizFailed(s6, appId6);
  check("COALESCE fallback retrieves evaluation overall_score (52)", Number(res6.interview_score) === 52);
  check("Candidate with 52% interview is failed below 60% threshold", isInterviewFailed(res6) === true);

  // Sub-case 6b: application with no interview sessions at all
  console.log("\nScenario 6b: Application with No Interview Sessions Handled Safely");
  const s6b = await createStudent("no_interview");
  const app6b = await pool.query(
    `INSERT INTO applications (student_id, job_id, status, quiz_status, quiz_passed, best_quiz_score)
     VALUES ($1, $2, 'Applied', 'Completed', true, 75) RETURNING application_id`,
    [s6b, testJobId]
  );
  const appId6b = app6b.rows[0].application_id;
  createdAppIds.push(appId6b);

  let err6b = null;
  try {
    await assertApplicationQuizFailed(s6b, appId6b);
  } catch (e) {
    err6b = e;
  }
  check("No interview session -> safely handled, neither failed -> 403", err6b?.status === 403);

} catch (error) {
  console.error("FATAL test runner error:", error);
  failedTests += 1;
} finally {
  console.log("\nCleaning up test artifacts...");
  if (createdSessionIds.length) {
    await pool.query("DELETE FROM interview_evaluation WHERE session_id = ANY($1)", [createdSessionIds]).catch(() => {});
    await pool.query("DELETE FROM interview_sessions WHERE session_id = ANY($1)", [createdSessionIds]).catch(() => {});
  }
  if (createdAppIds.length) {
    await pool.query("DELETE FROM applications WHERE application_id = ANY($1)", [createdAppIds]).catch(() => {});
  }
  if (createdStudentIds.length) {
    await pool.query("DELETE FROM students WHERE student_id = ANY($1)", [createdStudentIds]).catch(() => {});
  }
  if (createdUserIds.length) {
    await pool.query("DELETE FROM users WHERE user_id = ANY($1)", [createdUserIds]).catch(() => {});
  }
  await pool.end();
  console.log("Cleanup complete.\n");

  console.log("=======================================================");
  console.log(`Results: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log("=======================================================\n");

  process.exit(failedTests === 0 ? 0 : 1);
}
