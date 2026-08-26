import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { callQwenAPI, extractJson, errorMessage } from "../services/qwen.js";
import { getStudentId } from "./candidate.js";
import { PASS_THRESHOLD } from "./quiz.js";

const router = Router();

async function assertInterviewEligibility(applicationId, studentId) {
  const appResult = await query(
    `SELECT a.*, j.job_title, j.description, j.location, j.experience_required, c.company_name
     FROM applications a
     JOIN jobs j ON j.job_id = a.job_id
     JOIN companies c ON c.company_id = j.company_id
     WHERE a.application_id = $1 AND a.student_id = $2`,
    [applicationId, studentId]
  );

  if (appResult.rows.length === 0) {
    const error = new Error("Application not found.");
    error.status = 404;
    throw error;
  }

  const application = appResult.rows[0];
  if (!application.quiz_passed) {
    const error = new Error(`Quiz not passed. You need at least ${PASS_THRESHOLD}% to start the AI interview.`);
    error.status = 403;
    throw error;
  }

  const resume = await query(
    "SELECT extracted_text, parsed_data FROM resumes WHERE student_id = $1 ORDER BY uploaded_at DESC LIMIT 1",
    [studentId]
  );
  if (!resume.rows[0]?.extracted_text) {
    const error = new Error("Upload your resume in your profile before starting the interview.");
    error.status = 400;
    throw error;
  }

  return { application, resume: resume.rows[0] };
}

async function generateInterviewQuestions(context) {
  const { resumeText, parsedData, job, quizScore } = context;
  const prompt = `Based on the candidate resume and job requirements below, generate EXACTLY 10 interview questions.

Candidate Resume:
${resumeText}

Parsed Resume Summary:
${JSON.stringify(parsedData || {}, null, 2)}

Target Job:
Title: ${job.job_title}
Company: ${job.company_name}
Description: ${job.description}
Location: ${job.location}
Experience Required: ${job.experience_required} years
Quiz Score: ${quizScore}%

Rules:
- Questions must be specific to this candidate and this job.
- Start with a brief introduction question.
- Include technical questions tied to required skills.
- Gradually increase difficulty.
- Return ONLY a JSON array of 10 question strings.
- No markdown. No explanation.

Return ONLY this format:
["Question 1?", "Question 2?", ...]`;

  const text = await callQwenAPI(prompt, 900);
  const questions = extractJson(text, "array");

  if (
    !Array.isArray(questions) ||
    questions.length !== 10 ||
    questions.some((question) => typeof question !== "string" || !question.trim())
  ) {
    throw new Error("Qwen returned an invalid interview question list.");
  }

  return questions.map((question) => question.trim());
}

router.post("/sessions", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    const { applicationId } = req.body;
    if (!applicationId) return res.status(400).json({ error: "applicationId is required." });

    const { application, resume } = await assertInterviewEligibility(applicationId, studentId);

    const existing = await query(
      `SELECT session_id, status FROM interview_sessions
       WHERE application_id = $1 AND status IN ('Scheduled', 'In Progress')
       ORDER BY interview_date DESC NULLS LAST LIMIT 1`,
      [applicationId]
    );

    if (existing.rows.length > 0) {
      const sessionId = existing.rows[0].session_id;
      const questions = await query(
        "SELECT question_id, question FROM interview_questions WHERE session_id = $1 ORDER BY question_id",
        [sessionId]
      );
      return res.json({
        sessionId,
        status: existing.rows[0].status,
        questions: questions.rows.map((row, index) => ({
          questionId: row.question_id,
          question: row.question,
          order: index + 1,
        })),
        resumeText: resume.extracted_text,
        candidateInfo: resume.parsed_data,
        job: {
          jobTitle: application.job_title,
          companyName: application.company_name,
          description: application.description,
        },
        resumed: true,
      });
    }

    const questions = await generateInterviewQuestions({
      resumeText: resume.extracted_text,
      parsedData: resume.parsed_data,
      job: application,
      quizScore: application.best_quiz_score,
    });

    const sessionInsert = await query(
      `INSERT INTO interview_sessions (application_id, interview_date, status)
       VALUES ($1, CURRENT_TIMESTAMP, 'In Progress')
       RETURNING session_id`,
      [applicationId]
    );
    const sessionId = sessionInsert.rows[0].session_id;

    const storedQuestions = [];
    for (const question of questions) {
      const insert = await query(
        "INSERT INTO interview_questions (session_id, question) VALUES ($1, $2) RETURNING question_id, question",
        [sessionId, question]
      );
      storedQuestions.push(insert.rows[0]);
    }

    await query("UPDATE applications SET status = 'Interview Scheduled' WHERE application_id = $1", [applicationId]);

    return res.status(201).json({
      sessionId,
      status: "In Progress",
      questions: storedQuestions.map((row, index) => ({
        questionId: row.question_id,
        question: row.question,
        order: index + 1,
      })),
      resumeText: resume.extracted_text,
      candidateInfo: resume.parsed_data,
      job: {
        jobTitle: application.job_title,
        companyName: application.company_name,
        description: application.description,
      },
      resumed: false,
    });
  } catch (error) {
    console.error("Interview session create error:", error.message);
    return res.status(error.status || 500).json({ error: errorMessage(error) });
  }
});

router.get("/sessions/:sessionId", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    const sessionResult = await query(
      `SELECT isess.*, a.student_id, a.application_id, a.quiz_passed,
              j.job_title, c.company_name
       FROM interview_sessions isess
       JOIN applications a ON a.application_id = isess.application_id
       JOIN jobs j ON j.job_id = a.job_id
       JOIN companies c ON c.company_id = j.company_id
       WHERE isess.session_id = $1`,
      [req.params.sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: "Interview session not found." });
    }

    const session = sessionResult.rows[0];
    if (session.student_id !== studentId) {
      return res.status(403).json({ error: "You do not have access to this interview session." });
    }
    if (!session.quiz_passed) {
      return res.status(403).json({ error: "Quiz must be passed before accessing the interview." });
    }

    const [questions, evaluation, resume] = await Promise.all([
      query("SELECT question_id, question FROM interview_questions WHERE session_id = $1 ORDER BY question_id", [session.session_id]),
      query("SELECT * FROM interview_evaluation WHERE session_id = $1", [session.session_id]),
      query("SELECT extracted_text, parsed_data FROM resumes WHERE student_id = $1 ORDER BY uploaded_at DESC LIMIT 1", [studentId]),
    ]);

    return res.json({
      session,
      questions: questions.rows,
      evaluation: evaluation.rows[0] || null,
      resumeText: resume.rows[0]?.extracted_text || "",
      candidateInfo: resume.rows[0]?.parsed_data || null,
    });
  } catch (error) {
    console.error("Interview session get error:", error.message);
    return res.status(500).json({ error: "Unable to load interview session." });
  }
});

router.post("/sessions/:sessionId/integrity-events", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    const { eventType, severity, details = {} } = req.body;
    if (!eventType || !severity) return res.status(400).json({ error: "eventType and severity are required." });
    const owner = await query(
      `SELECT isess.session_id FROM interview_sessions isess
       JOIN applications a ON a.application_id = isess.application_id
       WHERE isess.session_id = $1 AND a.student_id = $2`,
      [req.params.sessionId, studentId]
    );
    if (!owner.rows.length) return res.status(404).json({ error: "Interview session not found." });
    await query(
      `INSERT INTO interview_integrity_events (session_id, event_type, severity, details)
       VALUES ($1, $2, $3, $4)`,
      [req.params.sessionId, String(eventType).slice(0, 60), String(severity).slice(0, 20), JSON.stringify(details)]
    );
    return res.status(201).json({ stored: true });
  } catch (error) {
    console.error("Integrity event error:", error.message);
    return res.status(500).json({ error: "Unable to store integrity event." });
  }
});

router.post("/sessions/:sessionId/complete", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    const { answers, metadata = {} } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "answers array is required." });
    }

    const sessionResult = await query(
      `SELECT isess.*, a.student_id, a.application_id, a.quiz_passed,
              j.job_title, j.description, c.company_name
       FROM interview_sessions isess
       JOIN applications a ON a.application_id = isess.application_id
       JOIN jobs j ON j.job_id = a.job_id
       JOIN companies c ON c.company_id = j.company_id
       WHERE isess.session_id = $1`,
      [req.params.sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: "Interview session not found." });
    }

    const session = sessionResult.rows[0];
    if (session.student_id !== studentId) {
      return res.status(403).json({ error: "You do not have access to this interview session." });
    }
    if (!session.quiz_passed) {
      return res.status(403).json({ error: "Quiz must be passed before completing the interview." });
    }

    const resume = await query(
      "SELECT extracted_text, parsed_data FROM resumes WHERE student_id = $1 ORDER BY uploaded_at DESC LIMIT 1",
      [studentId]
    );
    const resumeText = resume.rows[0]?.extracted_text || "";

    const questions = await query(
      "SELECT question_id, question FROM interview_questions WHERE session_id = $1 ORDER BY question_id",
      [session.session_id]
    );

    for (const item of answers) {
      await query(
        `INSERT INTO interview_answers (question_id, answer, score)
         VALUES ($1, $2, NULL)
         ON CONFLICT DO NOTHING`,
        [item.questionId, item.answer]
      );
    }

    const transcript = questions.rows
      .map((question, index) => {
        const answer = answers.find((item) => Number(item.questionId) === Number(question.question_id))?.answer || "(No answer provided)";
        return `Q${index + 1}: ${question.question}\nA${index + 1}: ${answer}`;
      })
      .join("\n\n");

    const integrityNote =
      Array.isArray(metadata.integrityEvents) && metadata.integrityEvents.length
        ? `Observed browser integrity events: ${metadata.integrityEvents.map((event) => event.type).join(", ")}.`
        : "No browser integrity events were recorded.";

    const prompt = `Candidate Resume:
${resumeText}

Target Job:
Title: ${session.job_title}
Company: ${session.company_name}
Description: ${session.description}

Below is a complete interview transcript for this candidate. Evaluate the entire interview objectively.

Interview Transcript:
${transcript}

Evaluation Instructions:
- Base every score ONLY on what was actually said in the answers above.
- Consider relevance to the job requirements.
- Do NOT fabricate information.
- ${integrityNote}

Return ONLY valid JSON in exactly this format:
{
  "overallScore": <integer 0-100>,
  "technicalScore": <integer 0-100>,
  "communicationScore": <integer 0-100>,
  "problemSolvingScore": <integer 0-100>,
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "recommendation": "<one-line verdict>",
  "feedback": "<2-4 sentence holistic assessment>"
}`;

    const text = await callQwenAPI(prompt, 900);
    const evaluation = extractJson(text, "object");

    const scoreFields = ["overallScore", "technicalScore", "communicationScore", "problemSolvingScore"];
    if (
      !scoreFields.every((field) => Number.isInteger(evaluation[field]) && evaluation[field] >= 0 && evaluation[field] <= 100) ||
      typeof evaluation.feedback !== "string" ||
      typeof evaluation.recommendation !== "string"
    ) {
      throw new Error("Qwen returned an invalid final evaluation.");
    }

    await query("DELETE FROM interview_evaluation WHERE session_id = $1", [session.session_id]);
    await query(
      `INSERT INTO interview_evaluation
       (session_id, communication_score, technical_score, confidence_score, overall_feedback,
        overall_score, problem_solving_score, recommendation, strengths, weaknesses)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        session.session_id,
        evaluation.communicationScore,
        evaluation.technicalScore,
        evaluation.problemSolvingScore,
        evaluation.feedback,
        evaluation.overallScore,
        evaluation.problemSolvingScore,
        evaluation.recommendation,
        JSON.stringify(evaluation.strengths),
        JSON.stringify(evaluation.weaknesses),
      ]
    );

    await query(
      `UPDATE interview_sessions
       SET status = 'Completed',
           overall_score = $2,
           feedback = $3,
           duration_seconds = $4
       WHERE session_id = $1`,
      [session.session_id, evaluation.overallScore, evaluation.feedback, metadata.durationSeconds || null]
    );

    await query("UPDATE applications SET status = 'Shortlisted' WHERE application_id = $1", [session.application_id]);

    return res.json({ evaluation });
  } catch (error) {
    console.error("Interview complete error:", error.message);
    return res.status(500).json({ error: errorMessage(error) });
  }
});

export default router;
