import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { callQwenAPI, extractJson, errorMessage } from "../services/qwen.js";
import { getStudentId } from "./candidate.js";

const router = Router();
const PASS_THRESHOLD = 60;
const QUESTION_COUNT = 10;

async function loadApplicationForStudent(applicationId, studentId) {
  const result = await query(
    `SELECT a.*, j.job_title, j.description, c.company_name
     FROM applications a
     JOIN jobs j ON j.job_id = a.job_id
     JOIN companies c ON c.company_id = j.company_id
     WHERE a.application_id = $1 AND a.student_id = $2`,
    [applicationId, studentId]
  );
  return result.rows[0] || null;
}

async function generateQuizQuestions(jobTitle, jobDescription) {
  const prompt = `Create EXACTLY ${QUESTION_COUNT} multiple-choice quiz questions for a job screening quiz.

Job Title: ${jobTitle}
Job Description: ${jobDescription}

Rules:
- Questions must test knowledge relevant to this job.
- Each question must have exactly 4 options.
- Include one clearly correct answer per question.
- Return ONLY valid JSON array.
- No markdown.

Return ONLY this format:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0
  }
]`;

  const text = await callQwenAPI(prompt, 1200);
  const questions = extractJson(text, "array");

  if (
    !Array.isArray(questions) ||
    questions.length !== QUESTION_COUNT ||
    questions.some(
      (item) =>
        !item.question ||
        !Array.isArray(item.options) ||
        item.options.length !== 4 ||
        typeof item.correctIndex !== "number" ||
        item.correctIndex < 0 ||
        item.correctIndex > 3
    )
  ) {
    throw new Error("Qwen returned an invalid quiz question set.");
  }

  return questions;
}

router.post("/start", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    const { applicationId } = req.body;
    if (!applicationId) return res.status(400).json({ error: "applicationId is required." });

    const application = await loadApplicationForStudent(applicationId, studentId);
    if (!application) return res.status(404).json({ error: "Application not found." });

    if (application.quiz_passed) {
      return res.status(400).json({ error: "You have already passed the quiz for this application." });
    }

    const inProgress = await query(
      `SELECT attempt_id FROM quiz_attempts
       WHERE application_id = $1 AND status = 'In Progress'
       ORDER BY started_at DESC LIMIT 1`,
      [applicationId]
    );

    if (inProgress.rows.length > 0) {
      const attemptId = inProgress.rows[0].attempt_id;
      const questions = await query(
        `SELECT question_id, question_text, options, question_order
         FROM quiz_questions
         WHERE attempt_id = $1
         ORDER BY question_order`,
        [attemptId]
      );
      return res.json({ attemptId, questions: questions.rows, resumed: true });
    }

    const generated = await generateQuizQuestions(application.job_title, application.description);
    const attemptInsert = await query(
      `INSERT INTO quiz_attempts (application_id, student_id, job_id, total_questions, status)
       VALUES ($1, $2, $3, $4, 'In Progress')
       RETURNING attempt_id`,
      [applicationId, studentId, application.job_id, QUESTION_COUNT]
    );
    const attemptId = attemptInsert.rows[0].attempt_id;

    const storedQuestions = [];
    for (let index = 0; index < generated.length; index += 1) {
      const item = generated[index];
      const insert = await query(
        `INSERT INTO quiz_questions (attempt_id, question_text, options, correct_option_index, question_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING question_id, question_text, options, question_order`,
        [attemptId, item.question.trim(), JSON.stringify(item.options), item.correctIndex, index + 1]
      );
      storedQuestions.push(insert.rows[0]);
    }

    await query("UPDATE applications SET quiz_status = 'In Progress' WHERE application_id = $1", [applicationId]);

    return res.status(201).json({ attemptId, questions: storedQuestions, resumed: false });
  } catch (error) {
    console.error("Quiz start error:", error.message);
    return res.status(500).json({ error: errorMessage(error) });
  }
});

router.post("/submit", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    const { attemptId, answers } = req.body;

    if (!attemptId || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "attemptId and answers are required." });
    }

    const attemptResult = await query(
      `SELECT qa.*, a.application_id
       FROM quiz_attempts qa
       JOIN applications a ON a.application_id = qa.application_id
       WHERE qa.attempt_id = $1 AND qa.student_id = $2`,
      [attemptId, studentId]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: "Quiz attempt not found." });
    }

    const attempt = attemptResult.rows[0];
    if (attempt.status === "Completed") {
      return res.status(400).json({ error: "This quiz attempt has already been submitted." });
    }

    const questions = await query(
      "SELECT question_id, correct_option_index FROM quiz_questions WHERE attempt_id = $1",
      [attemptId]
    );
    const questionMap = new Map(questions.rows.map((row) => [row.question_id, row.correct_option_index]));

    let correctCount = 0;
    for (const answer of answers) {
      const correctIndex = questionMap.get(answer.questionId);
      if (correctIndex === undefined) continue;
      const isCorrect = Number(answer.selectedOptionIndex) === Number(correctIndex);
      if (isCorrect) correctCount += 1;

      await query(
        `INSERT INTO quiz_answers (attempt_id, question_id, selected_option_index, is_correct)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [attemptId, answer.questionId, answer.selectedOptionIndex, isCorrect]
      );
    }

    const score = Math.round((correctCount / questions.rows.length) * 10000) / 100;
    const passed = score >= PASS_THRESHOLD;

    await query(
      `UPDATE quiz_attempts
       SET score = $2, passed = $3, correct_answers = $4, status = 'Completed', completed_at = CURRENT_TIMESTAMP
       WHERE attempt_id = $1`,
      [attemptId, score, passed, correctCount]
    );

    await query(
      `UPDATE applications
       SET quiz_status = 'Completed',
           quiz_passed = CASE WHEN $2 THEN true ELSE quiz_passed END,
           best_quiz_score = GREATEST(COALESCE(best_quiz_score, 0), $3)
       WHERE application_id = $1`,
      [attempt.application_id, passed, score]
    );

    return res.json({
      score,
      passed,
      correctCount,
      totalQuestions: questions.rows.length,
      message: passed
        ? "Quiz Passed — You are eligible for the AI Interview."
        : `Quiz Score: ${score}% — You need at least ${PASS_THRESHOLD}% to continue.`,
    });
  } catch (error) {
    console.error("Quiz submit error:", error.message);
    return res.status(500).json({ error: errorMessage(error) });
  }
});

router.get("/status/:applicationId", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    const application = await loadApplicationForStudent(req.params.applicationId, studentId);
    if (!application) return res.status(404).json({ error: "Application not found." });

    const attempts = await query(
      `SELECT attempt_id, score, passed, status, completed_at
       FROM quiz_attempts
       WHERE application_id = $1
       ORDER BY completed_at DESC NULLS LAST, started_at DESC`,
      [application.application_id]
    );

    return res.json({
      quizStatus: application.quiz_status,
      quizPassed: application.quiz_passed,
      bestQuizScore: application.best_quiz_score,
      attempts: attempts.rows,
      passThreshold: PASS_THRESHOLD,
    });
  } catch (error) {
    console.error("Quiz status error:", error.message);
    return res.status(500).json({ error: "Unable to load quiz status." });
  }
});

export { PASS_THRESHOLD };
export default router;
