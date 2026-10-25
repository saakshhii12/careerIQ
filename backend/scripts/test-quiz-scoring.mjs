import { query } from "../db.js";
import { PASS_THRESHOLD } from "../routes/quiz.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function createTestStudent(email) {
  const user = await query(
    `INSERT INTO users (email, password, role, full_name)
     VALUES ($1, 'hash', 'student', 'Quiz Test User')
     ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
     RETURNING user_id`,
    [email]
  );
  const userId = user.rows[0].user_id;
  const student = await query(
    `INSERT INTO students (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING student_id`,
    [userId]
  );
  const studentId = student.rows[0].student_id;
  const token = jwt.sign({ userId, email, role: "student" }, JWT_SECRET, { expiresIn: "1h" });
  return { userId, studentId, token };
}

async function createTestJob() {
  const company = await query("SELECT company_id FROM companies LIMIT 1");
  const compId = company.rows[0]?.company_id || 1;
  const job = await query(
    `INSERT INTO jobs (company_id, job_title, description, location)
     VALUES ($1, 'Full Stack Engineer', 'Node.js and React screening', 'Remote')
     RETURNING job_id`,
    [compId]
  );
  return job.rows[0].job_id;
}

async function createTestApplication(studentId, jobId) {
  const app = await query(
    `INSERT INTO applications (student_id, job_id, status, quiz_status, quiz_passed)
     VALUES ($1, $2, 'Applied', 'Not Started', false)
     RETURNING application_id`,
    [studentId, jobId]
  );
  return app.rows[0].application_id;
}

async function makeQuizAttempt(appId, studentId, jobId) {
  const attempt = await query(
    `INSERT INTO quiz_attempts (application_id, student_id, job_id, total_questions, status)
     VALUES ($1, $2, $3, 10, 'In Progress')
     RETURNING attempt_id`,
    [appId, studentId, jobId]
  );
  const attemptId = Number(attempt.rows[0].attempt_id);

  const questions = [];
  for (let i = 1; i <= 10; i++) {
    const q = await query(
      `INSERT INTO quiz_questions (attempt_id, question_text, options, correct_option_index, question_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING question_id, correct_option_index`,
      [attemptId, `Question ${i}?`, JSON.stringify(["A", "B", "C", "D"]), (i % 4), i]
    );
    questions.push({
      question_id: q.rows[0].question_id,
      correct_option_index: Number(q.rows[0].correct_option_index),
    });
  }
  return { attemptId, questions };
}

async function submitViaApi(token, attemptId, answers) {
  const res = await fetch("http://localhost:5000/api/quiz/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ attemptId, answers }),
  });
  const data = await res.json();
  return { status: res.status, body: data };
}

async function runTests() {
  console.log("=== RUNNING QUIZ SCORING REGRESSION SUITE ===");
  const jobId = await createTestJob();

  // TEST 1: 100% (All 10 correct) with string questionId (simulating real frontend)
  {
    console.log("\n--- Test 1: All 10 correct answers with String questionId (Frontend format) ---");
    const { studentId, token } = await createTestStudent("quiz_test_100@example.com");
    const appId = await createTestApplication(studentId, jobId);
    const { attemptId, questions } = await makeQuizAttempt(appId, studentId, jobId);

    // Pass string questionId exactly like the browser sent before
    const answers = questions.map((q) => ({
      questionId: String(q.question_id),
      selectedOptionIndex: q.correct_option_index,
    }));

    const result = await submitViaApi(token, attemptId, answers);
    console.log("Submit result:", result.body);

    if (result.status !== 200) throw new Error(`Submit failed: ${result.status}`);
    if (result.body.score !== 100) throw new Error(`Expected score 100, got ${result.body.score}`);
    if (result.body.correctCount !== 10) throw new Error(`Expected correctCount 10, got ${result.body.correctCount}`);
    if (result.body.passed !== true) throw new Error("Expected passed = true");

    const appCheck = await query("SELECT status, quiz_status, quiz_passed, best_quiz_score FROM applications WHERE application_id = $1", [appId]);
    console.log("DB Application row:", appCheck.rows[0]);
    if (appCheck.rows[0].quiz_passed !== true) throw new Error("DB quiz_passed should be true");
    if (appCheck.rows[0].status === "Rejected") throw new Error("DB status should NOT be Rejected");
    if (Number(appCheck.rows[0].best_quiz_score) !== 100) throw new Error("DB best_quiz_score should be 100");
    console.log("✔ Test 1 PASSED: 100% scored and saved correctly.");
  }

  // TEST 2: Exactly 60% (6 correct, 4 incorrect) -> Pass at threshold
  {
    console.log("\n--- Test 2: Exactly 60% (6 correct, 4 incorrect) at threshold ---");
    const { studentId, token } = await createTestStudent("quiz_test_60@example.com");
    const appId = await createTestApplication(studentId, jobId);
    const { attemptId, questions } = await makeQuizAttempt(appId, studentId, jobId);

    const answers = questions.map((q, idx) => ({
      questionId: Number(q.question_id),
      selectedOptionIndex: idx < 6 ? q.correct_option_index : (q.correct_option_index + 1) % 4,
    }));

    const result = await submitViaApi(token, attemptId, answers);
    console.log("Submit result:", result.body);

    if (result.body.score !== 60) throw new Error(`Expected score 60, got ${result.body.score}`);
    if (result.body.correctCount !== 6) throw new Error(`Expected correctCount 6, got ${result.body.correctCount}`);
    if (result.body.passed !== true) throw new Error("Expected passed = true at 60%");

    const appCheck = await query("SELECT status, quiz_passed, best_quiz_score FROM applications WHERE application_id = $1", [appId]);
    if (appCheck.rows[0].quiz_passed !== true) throw new Error("DB quiz_passed should be true for 60%");
    if (appCheck.rows[0].status === "Rejected") throw new Error("Application should NOT be Rejected at 60%");
    console.log("✔ Test 2 PASSED: 60% threshold passes correctly.");
  }

  // TEST 3: Exactly 50% (5 correct, 5 incorrect) -> Fail below threshold
  {
    console.log("\n--- Test 3: Exactly 50% (5 correct, 5 incorrect) below threshold ---");
    const { studentId, token } = await createTestStudent("quiz_test_50@example.com");
    const appId = await createTestApplication(studentId, jobId);
    const { attemptId, questions } = await makeQuizAttempt(appId, studentId, jobId);

    const answers = questions.map((q, idx) => ({
      questionId: q.question_id,
      selectedOptionIndex: idx < 5 ? q.correct_option_index : (q.correct_option_index + 1) % 4,
    }));

    const result = await submitViaApi(token, attemptId, answers);
    console.log("Submit result:", result.body);

    if (result.body.score !== 50) throw new Error(`Expected score 50, got ${result.body.score}`);
    if (result.body.correctCount !== 5) throw new Error(`Expected correctCount 5, got ${result.body.correctCount}`);
    if (result.body.passed !== false) throw new Error("Expected passed = false at 50%");

    const appCheck = await query("SELECT status, quiz_passed, best_quiz_score FROM applications WHERE application_id = $1", [appId]);
    if (appCheck.rows[0].quiz_passed !== false) throw new Error("DB quiz_passed should be false for 50%");
    if (appCheck.rows[0].status !== "Rejected") throw new Error("Application should be Rejected at 50%");
    console.log("✔ Test 3 PASSED: 50% fails correctly and marks application Rejected.");
  }

  // TEST 4: 0% (All 10 incorrect)
  {
    console.log("\n--- Test 4: All 10 incorrect answers produce 0% ---");
    const { studentId, token } = await createTestStudent("quiz_test_0@example.com");
    const appId = await createTestApplication(studentId, jobId);
    const { attemptId, questions } = await makeQuizAttempt(appId, studentId, jobId);

    const answers = questions.map((q) => ({
      questionId: q.question_id,
      selectedOptionIndex: (q.correct_option_index + 1) % 4,
    }));

    const result = await submitViaApi(token, attemptId, answers);
    console.log("Submit result:", result.body);

    if (result.body.score !== 0) throw new Error(`Expected score 0, got ${result.body.score}`);
    if (result.body.correctCount !== 0) throw new Error(`Expected correctCount 0, got ${result.body.correctCount}`);
    if (result.body.passed !== false) throw new Error("Expected passed = false at 0%");

    const appCheck = await query("SELECT status, quiz_passed, best_quiz_score FROM applications WHERE application_id = $1", [appId]);
    if (appCheck.rows[0].quiz_passed !== false) throw new Error("DB quiz_passed should be false for 0%");
    if (appCheck.rows[0].status !== "Rejected") throw new Error("Application should be Rejected at 0%");
    console.log("✔ Test 4 PASSED: 0% scored and application marked Rejected.");
  }

  // TEST 5: 70% (7 correct, 3 incorrect) with snake_case payload
  {
    console.log("\n--- Test 5: 70% with snake_case payload (question_id / selected_option_index) ---");
    const { studentId, token } = await createTestStudent("quiz_test_70@example.com");
    const appId = await createTestApplication(studentId, jobId);
    const { attemptId, questions } = await makeQuizAttempt(appId, studentId, jobId);

    const answers = questions.map((q, idx) => ({
      question_id: q.question_id,
      selected_option_index: idx < 7 ? q.correct_option_index : (q.correct_option_index + 1) % 4,
    }));

    const result = await submitViaApi(token, attemptId, answers);
    console.log("Submit result:", result.body);

    if (result.body.score !== 70) throw new Error(`Expected score 70, got ${result.body.score}`);
    if (result.body.correctCount !== 7) throw new Error(`Expected correctCount 7, got ${result.body.correctCount}`);
    if (result.body.passed !== true) throw new Error("Expected passed = true at 70%");
    console.log("✔ Test 5 PASSED: 70% with snake_case payload passed.");
  }

  console.log("\n==========================================");
  console.log("ALL 5 QUIZ SCORING REGRESSION TESTS PASSED!");
  console.log("==========================================");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
