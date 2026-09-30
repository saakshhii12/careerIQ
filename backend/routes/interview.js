import { Router } from "express";
import { query, dbErrorDetails } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  buildFinalInterviewEvaluationPrompt,
  buildIntegrityNote,
  buildProductionInterviewQuestionsPrompt,
  validateFinalEvaluationObject,
  validateInterviewQuestionList,
} from "../services/ai-prompts.js";
import { callQwenAPI, extractJson, errorMessage } from "../services/qwen.js";
import { createNotification, notifyRecruitersForApplication } from "../services/notifications.js";
import { getStudentId } from "./candidate.js";
import { QUIZ_PASS_THRESHOLD, INTERVIEW_PASS_THRESHOLD } from "../services/pipeline.js";
import { ensureConversation } from "./messages.js";
import {
  evaluateContinuousMatch,
  evaluateIdentityCheck,
  isValidDescriptor,
} from "../services/identity.js";
import { normalizeIntegritySeverity } from "../services/integrity-severity.js";

const router = Router();

async function getOwnedInterviewSession(sessionId, studentId) {
  const sessionResult = await query(
    `SELECT isess.*, a.student_id, a.application_id, a.quiz_passed,
            j.job_title, j.description, c.company_name,
            s.face_descriptor AS student_face_descriptor,
            s.photo_path AS student_photo_path
     FROM interview_sessions isess
     JOIN applications a ON a.application_id = isess.application_id
     JOIN jobs j ON j.job_id = a.job_id
     JOIN companies c ON c.company_id = j.company_id
     JOIN students s ON s.student_id = a.student_id
     WHERE isess.session_id = $1`,
    [sessionId]
  );
  if (!sessionResult.rows.length) {
    const error = new Error("Interview session not found.");
    error.status = 404;
    throw error;
  }
  const session = sessionResult.rows[0];
  if (Number(session.student_id) !== Number(studentId)) {
    const error = new Error("You do not have access to this interview session.");
    error.status = 403;
    throw error;
  }
  if (!session.quiz_passed) {
    const error = new Error("Quiz must be passed before accessing the interview.");
    error.status = 403;
    throw error;
  }
  return session;
}

function parseDescriptor(raw) {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

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
  if (application.status === "Rejected") {
    const error = new Error("This application cannot proceed.");
    error.status = 403;
    throw error;
  }
  if (!application.quiz_passed) {
    const error = new Error(
      `Quiz not passed. You need at least ${QUIZ_PASS_THRESHOLD}% to start the AI interview.`
    );
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
  const prompt = buildProductionInterviewQuestionsPrompt(context);
  const text = await callQwenAPI(prompt, 900);
  const questions = extractJson(text, "array");

  if (!validateInterviewQuestionList(questions)) {
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

    const alreadyDone = await query(
      `SELECT session_id FROM interview_sessions
       WHERE application_id = $1 AND status = 'Completed'
       LIMIT 1`,
      [applicationId]
    );
    if (alreadyDone.rows.length > 0) {
      return res.status(400).json({ error: "The interview for this application is already complete." });
    }

    const existing = await query(
      `SELECT session_id, status, identity_status FROM interview_sessions
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
        identityStatus: existing.rows[0].identity_status || "not_started",
        identityVerified: (existing.rows[0].identity_status || "not_started") === "passed",
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
      `INSERT INTO interview_sessions (application_id, interview_date, status, identity_status)
       VALUES ($1, CURRENT_TIMESTAMP, 'In Progress', 'not_started')
       RETURNING session_id, identity_status`,
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

    await createNotification(req.user.userId, {
      type: "interview_scheduled",
      message: `Interview started for ${application.job_title} at ${application.company_name}.`,
      link: `/student/interview/${sessionId}`,
    });

    return res.status(201).json({
      sessionId,
      status: "In Progress",
      identityStatus: "not_started",
      identityVerified: false,
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
    const session = await getOwnedInterviewSession(req.params.sessionId, studentId);

    const [questions, evaluation, resume] = await Promise.all([
      query("SELECT question_id, question FROM interview_questions WHERE session_id = $1 ORDER BY question_id", [session.session_id]),
      query("SELECT * FROM interview_evaluation WHERE session_id = $1", [session.session_id]),
      query("SELECT extracted_text, parsed_data FROM resumes WHERE student_id = $1 ORDER BY uploaded_at DESC LIMIT 1", [studentId]),
    ]);

    const parsedCandidate =
      typeof resume.rows[0]?.parsed_data === "string"
        ? JSON.parse(resume.rows[0].parsed_data)
        : resume.rows[0]?.parsed_data || null;

    const identityStatus = session.identity_status || "not_started";

    return res.json({
      sessionId: session.session_id,
      status: session.status,
      identityStatus,
      identityVerified: identityStatus === "passed",
      hasEnrolledIdentity: Boolean(parseDescriptor(session.student_face_descriptor)),
      hasVerificationPhoto: Boolean(session.student_photo_path),
      questions: questions.rows.map((row, index) => ({
        questionId: row.question_id,
        question: row.question,
        order: index + 1,
      })),
      resumeText: resume.rows[0]?.extracted_text || "",
      candidateInfo: parsedCandidate,
      job: {
        jobTitle: session.job_title,
        companyName: session.company_name,
        description: session.description,
      },
      evaluation: evaluation.rows[0] || null,
      resumed: true,
    });
  } catch (error) {
    console.error("Interview session get error:", error.message);
    return res.status(error.status || 500).json({ error: error.message || "Unable to load interview session." });
  }
});

router.post("/sessions/:sessionId/identity-check", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    const session = await getOwnedInterviewSession(req.params.sessionId, studentId);

    const {
      faceCount,
      liveDescriptor,
      challengeDescriptor,
      claimLivenessPassed = false,
      enrollIfMissing = true,
    } = req.body || {};

    const referenceDescriptor = parseDescriptor(session.student_face_descriptor);
    const evaluation = evaluateIdentityCheck({
      faceCount: Number(faceCount),
      liveDescriptor,
      challengeDescriptor,
      referenceDescriptor,
      claimLivenessPassed: Boolean(claimLivenessPassed),
    });

    // First-time enrollment: no stored descriptor yet, but liveness + single face succeeded.
    let enrolled = false;
    if (
      !evaluation.enrolledReferenceUsed &&
      evaluation.livenessPassed &&
      Number(faceCount) === 1 &&
      isValidDescriptor(liveDescriptor) &&
      enrollIfMissing
    ) {
      await query("UPDATE students SET face_descriptor = $2 WHERE student_id = $1", [
        studentId,
        JSON.stringify(liveDescriptor),
      ]);
      enrolled = true;
      evaluation.passed = true;
      evaluation.reasons = evaluation.reasons.filter(
        (reason) => !/match|identity/i.test(reason)
      );
      evaluation.matchScore = 1;
    }

    const status = evaluation.passed ? "passed" : "failed";
    await query(
      `INSERT INTO interview_identity_checks
       (session_id, student_id, status, match_score, liveness_passed, face_count, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        session.session_id,
        studentId,
        status,
        evaluation.matchScore,
        evaluation.livenessPassed,
        Number.isInteger(Number(faceCount)) ? Number(faceCount) : null,
        JSON.stringify({
          reasons: evaluation.reasons,
          enrolled,
          thresholds: evaluation.thresholds,
          userId: req.user.userId,
        }),
      ]
    );

    if (evaluation.passed) {
      await query(
        `UPDATE interview_sessions
         SET identity_status = 'passed',
             identity_verified_at = CURRENT_TIMESTAMP,
             identity_match_score = $2,
             identity_baseline = $3::jsonb
         WHERE session_id = $1`,
        [session.session_id, evaluation.matchScore ?? 1, JSON.stringify(liveDescriptor)]
      );
    } else {
      await query(
        `UPDATE interview_sessions
         SET identity_status = 'failed',
             identity_match_score = $2
         WHERE session_id = $1`,
        [session.session_id, evaluation.matchScore]
      );
      await query(
        `INSERT INTO interview_integrity_events (session_id, event_type, severity, details)
         VALUES ($1, $2, $3, $4)`,
        [
          session.session_id,
          "IDENTITY_FAILED",
          normalizeIntegritySeverity("high"),
          JSON.stringify({ reasons: evaluation.reasons, matchScore: evaluation.matchScore }),
        ]
      );
    }

    return res.status(evaluation.passed ? 200 : 403).json({
      passed: evaluation.passed,
      identityStatus: status,
      livenessPassed: evaluation.livenessPassed,
      matchScore: evaluation.matchScore,
      enrolled,
      reasons: evaluation.reasons,
      message: evaluation.passed
        ? "Identity verified. You may begin the interview."
        : evaluation.reasons[0] || "Identity verification failed.",
    });
  } catch (error) {
    console.error("Identity check error:", error.message);
    return res.status(error.status || 500).json({ error: error.message || "Unable to verify identity." });
  }
});

router.post("/sessions/:sessionId/identity-monitor", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    const session = await getOwnedInterviewSession(req.params.sessionId, studentId);

    if ((session.identity_status || "not_started") !== "passed") {
      return res.status(403).json({
        matched: false,
        error: "Identity verification must succeed before the interview can continue.",
      });
    }

    const liveDescriptor = req.body?.liveDescriptor;
    const baseline =
      parseDescriptor(session.identity_baseline) || parseDescriptor(session.student_face_descriptor);
    const result = evaluateContinuousMatch(liveDescriptor, baseline);

    if (!result.matched) {
      await query(
        `UPDATE interview_sessions SET identity_status = 'paused' WHERE session_id = $1`,
        [session.session_id]
      );
      await query(
        `INSERT INTO interview_integrity_events (session_id, event_type, severity, details)
         VALUES ($1, $2, $3, $4)`,
        [
          session.session_id,
          "IDENTITY_MISMATCH",
          normalizeIntegritySeverity("high"),
          JSON.stringify({ matchScore: result.matchScore, reason: result.reason }),
        ]
      );
      await query(
        `INSERT INTO interview_identity_checks
         (session_id, student_id, status, match_score, liveness_passed, face_count, details)
         VALUES ($1, $2, 'paused', $3, true, 1, $4)`,
        [
          session.session_id,
          studentId,
          result.matchScore,
          JSON.stringify({ reason: result.reason }),
        ]
      );
      return res.status(409).json({
        matched: false,
        identityStatus: "paused",
        matchScore: result.matchScore,
        reason: result.reason || "Possible identity mismatch.",
      });
    }

    return res.json({
      matched: true,
      identityStatus: "passed",
      matchScore: result.matchScore,
    });
  } catch (error) {
    console.error("Identity monitor error:", error.message);
    return res.status(error.status || 500).json({ error: error.message || "Unable to monitor identity." });
  }
});

router.post("/sessions/:sessionId/integrity-events", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    const { eventType, severity, details = {} } = req.body;
    if (!eventType || !severity) return res.status(400).json({ error: "eventType and severity are required." });
    const normalizedSeverity = normalizeIntegritySeverity(severity);
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
      [req.params.sessionId, String(eventType).slice(0, 60), normalizedSeverity, JSON.stringify(details)]
    );
    if (normalizedSeverity !== "info" && String(eventType) !== "QUESTION_TIMING") {
      await query(
        `UPDATE interview_sessions
         SET integrity_violation_count = COALESCE(integrity_violation_count, 0) + 1
         WHERE session_id = $1`,
        [req.params.sessionId]
      );
    }
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
    if ((session.identity_status || "not_started") !== "passed") {
      return res.status(403).json({
        error: "Identity verification must succeed before the interview can be completed.",
      });
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

    // Only accept answers to questions that belong to this session, so a client
    // cannot write answers onto another candidate's interview.
    const sessionQuestionIds = new Set(questions.rows.map((row) => Number(row.question_id)));
    for (const item of answers) {
      if (!sessionQuestionIds.has(Number(item.questionId))) continue;
      await query(
        `INSERT INTO interview_answers (question_id, answer, score)
         VALUES ($1, $2, NULL)
         ON CONFLICT (question_id) DO UPDATE SET answer = EXCLUDED.answer`,
        [item.questionId, item.answer]
      );
    }

    // Persist per-question wall-clock timing (client-reported) into integrity events.
    if (Array.isArray(metadata.questionTimings)) {
      for (const timing of metadata.questionTimings) {
        const questionId = Number(timing?.questionId);
        if (!sessionQuestionIds.has(questionId)) continue;
        await query(
          `INSERT INTO interview_integrity_events (session_id, event_type, severity, details)
           VALUES ($1, $2, $3, $4)`,
          [
            session.session_id,
            "QUESTION_TIMING",
            normalizeIntegritySeverity("info"),
            JSON.stringify({
              questionId,
              startedAt: timing.startedAt || null,
              submittedAt: timing.submittedAt || null,
              elapsedMs: timing.elapsedMs ?? null,
              timedOut: Boolean(timing.timedOut),
              answerLength: Number(timing.answerLength) || 0,
            }),
          ]
        );
      }
    }

    const transcript = questions.rows
      .map((question, index) => {
        const answer = answers.find((item) => Number(item.questionId) === Number(question.question_id))?.answer || "(No answer provided)";
        return `Q${index + 1}: ${question.question}\nA${index + 1}: ${answer}`;
      })
      .join("\n\n");

    const integrityNote = buildIntegrityNote(metadata.integrityEvents);
    const prompt = buildFinalInterviewEvaluationPrompt({
      resumeText,
      jobTitle: session.job_title,
      companyName: session.company_name,
      jobDescription: session.description,
      transcript,
      integrityNote,
    });

    const text = await callQwenAPI(prompt, 900);
    const evaluation = extractJson(text, "object");

    if (!validateFinalEvaluationObject(evaluation)) {
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

    const passed = evaluation.overallScore >= INTERVIEW_PASS_THRESHOLD;
    const outcome = passed ? "Shortlisted" : "Rejected";

    await query(
      `UPDATE applications
       SET status = $2
       WHERE application_id = $1 AND status <> 'Selected'`,
      [session.application_id, outcome]
    );

    if (passed) {
      const context = await query(
        `SELECT a.application_id, a.job_id, r.recruiter_id, rc.conversation_id
         FROM applications a
         JOIN jobs j ON j.job_id = a.job_id
         LEFT JOIN recruiters r ON r.company_id = j.company_id
         LEFT JOIN recruiter_conversations rc ON rc.application_id = a.application_id
         WHERE a.application_id = $1
         LIMIT 1`,
        [session.application_id]
      );
      const row = context.rows[0];
      if (row?.recruiter_id) {
        await ensureConversation({
          application_id: row.application_id,
          recruiter_id: row.recruiter_id,
          job_id: row.job_id,
          conversation_id: row.conversation_id,
        }).catch((error) => {
          console.warn("Interview pass: conversation provision skipped:", error.message);
        });
      }
    }

    await createNotification(req.user.userId, {
      type: "interview_completed",
      message: passed
        ? `Interview passed (${evaluation.overallScore}%) for ${session.job_title} at ${session.company_name}. You are shortlisted and can message the recruiter.`
        : `Interview scored ${evaluation.overallScore}% for ${session.job_title}. A score of at least ${INTERVIEW_PASS_THRESHOLD}% is required. This application cannot proceed.`,
      link: `/student/status/${session.application_id}`,
    });
    await notifyRecruitersForApplication(session.application_id, {
      type: passed ? "application_result" : "interview_completed",
      message: passed
        ? `A candidate completed the AI interview (${evaluation.overallScore}%) for ${session.job_title} and is shortlisted.`
        : `A candidate completed the AI interview (${evaluation.overallScore}%) for ${session.job_title} and did not meet the pass mark.`,
      link: `/recruiter/candidates/${session.application_id}`,
    });

    return res.json({
      evaluation,
      passed,
      passThreshold: INTERVIEW_PASS_THRESHOLD,
      outcome,
      chatUnlocked: passed,
    });
  } catch (error) {
    console.error("Interview complete error:", dbErrorDetails(error));
    return res.status(error.status || 500).json({ error: errorMessage(error) });
  }
});

export default router;
