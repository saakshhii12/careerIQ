import { query } from "../db.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function verifyApp83Flow() {
  console.log("=== VERIFYING APPLICATION 83 END-TO-END FLOW ===");

  // 1. Authenticate as Vishakha
  const user = await query("SELECT user_id, email, role FROM users WHERE email = 'vishakha120106@gmail.com'");
  const student = await query("SELECT student_id FROM students WHERE user_id = $1", [user.rows[0].user_id]);
  const token = jwt.sign(
    { userId: user.rows[0].user_id, email: user.rows[0].email, role: "student" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
  console.log("Authenticated as student ID:", student.rows[0].student_id);

  // 2. Fetch /api/quiz/start for application 83 (simulating user clicking 'Take Quiz' on status page)
  const startRes = await fetch("http://localhost:5000/api/quiz/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ applicationId: "83" }),
  });
  const startData = await startRes.json();
  console.log("Quiz Start Response:", {
    status: startRes.status,
    attemptId: startData.attemptId,
    resumed: startData.resumed,
    questionCount: startData.questions?.length,
  });

  if (startRes.status !== 200 && startRes.status !== 201) {
    throw new Error(`Start quiz failed: ${JSON.stringify(startData)}`);
  }

  // 3. Candidate selects answers:
  // Using authoritative answer key for attempt 22 from quiz_questions table
  const keyRows = await query(
    "SELECT question_id, correct_option_index FROM quiz_questions WHERE attempt_id = $1 ORDER BY question_order",
    [startData.attemptId]
  );
  const answerKey = new Map(keyRows.rows.map(r => [Number(r.question_id), Number(r.correct_option_index)]));

  // Simulate frontend state: selected[q.question_id] = idx
  const selected = {};
  for (const q of startData.questions) {
    selected[q.question_id] = answerKey.get(Number(q.question_id));
  }

  // Exact frontend handleSubmit logic:
  const answers = startData.questions.map((q) => ({
    questionId: Number(q.question_id),
    selectedOptionIndex: Number(selected[q.question_id] ?? 0),
  }));

  console.log("Submitting answers (first 3):", answers.slice(0, 3));

  // 4. Submit to /api/quiz/submit
  const submitRes = await fetch("http://localhost:5000/api/quiz/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ attemptId: startData.attemptId, answers }),
  });
  const submitData = await submitRes.json();
  console.log("\nQuiz Submit Response (Result Modal Data):", submitData);

  if (submitRes.status !== 200) {
    throw new Error(`Submit failed with status ${submitRes.status}: ${JSON.stringify(submitData)}`);
  }
  if (submitData.score !== 100) {
    throw new Error(`Expected 100%, got ${submitData.score}%`);
  }
  if (submitData.passed !== true) {
    throw new Error("Expected passed = true");
  }

  // 5. Verify database state for Application 83 and Attempt 22
  const appDb = await query("SELECT * FROM applications WHERE application_id = 83");
  console.log("\nDatabase applications row 83:", {
    status: appDb.rows[0].status,
    quiz_status: appDb.rows[0].quiz_status,
    quiz_passed: appDb.rows[0].quiz_passed,
    best_quiz_score: appDb.rows[0].best_quiz_score,
  });

  const attemptDb = await query("SELECT * FROM quiz_attempts WHERE attempt_id = $1", [startData.attemptId]);
  console.log("Database quiz_attempts row 22:", {
    status: attemptDb.rows[0].status,
    score: attemptDb.rows[0].score,
    passed: attemptDb.rows[0].passed,
    correct_answers: attemptDb.rows[0].correct_answers,
  });

  const answersDb = await query("SELECT count(*) FROM quiz_answers WHERE attempt_id = $1 AND is_correct = true", [startData.attemptId]);
  console.log("Database quiz_answers correct count:", answersDb.rows[0].count);

  if (appDb.rows[0].quiz_passed !== true) throw new Error("Application quiz_passed is not true");
  if (appDb.rows[0].status === "Rejected") throw new Error("Application status should not be Rejected");
  if (Number(appDb.rows[0].best_quiz_score) !== 100) throw new Error("Application best_quiz_score is not 100");
  if (Number(answersDb.rows[0].count) !== 10) throw new Error("quiz_answers correct count is not 10");

  // 6. Verify GET /api/applications/83 (the endpoint useApplication calls)
  const detailRes = await fetch("http://localhost:5000/api/applications/83", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const detailData = await detailRes.json();
  console.log("\nGET /api/candidate/applications/83 response (Frontend Data Source):", {
    status: detailData.application?.status,
    quiz_status: detailData.application?.quiz_status,
    quiz_passed: detailData.application?.quiz_passed,
    best_quiz_score: detailData.application?.best_quiz_score,
    interview_eligible: detailData.application?.quiz_passed && detailData.application?.status !== "Rejected",
  });

  console.log("\n=======================================================");
  console.log("✔ APPLICATION 83 END-TO-END FLOW VERIFIED SUCCESSFULLY!");
  console.log("=======================================================");
  process.exit(0);
}

verifyApp83Flow().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
