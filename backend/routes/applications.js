import { Router } from "express";
import { query, dbErrorDetails } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { computeJobMatch, persistApplicationMatch } from "../services/matching.js";
import { createNotification, notifyRecruitersForApplication } from "../services/notifications.js";
import { getStudentId } from "./candidate.js";

const router = Router();

router.post("/", requireAuth, requireRole("student"), async (req, res) => {
  // studentId is derived from the verified JWT, so a client cannot apply on
  // another candidate's behalf by posting a different student_id.
  const studentId = await getStudentId(req.user.userId).catch(() => null);

  try {
    if (!studentId) return res.status(404).json({ error: "Student profile not found." });

    const jobId = Number(req.body?.jobId);
    if (!Number.isInteger(jobId) || jobId <= 0) {
      return res.status(400).json({ error: "A valid jobId is required." });
    }

    const job = await query(
      `SELECT j.job_id, j.job_title, j.company_id, c.company_name
       FROM jobs j
       JOIN companies c ON c.company_id = j.company_id
       WHERE j.job_id = $1`,
      [jobId]
    );
    if (job.rows.length === 0) {
      return res.status(404).json({ error: "This job is no longer available." });
    }

    const existing = await query(
      "SELECT application_id FROM applications WHERE student_id = $1 AND job_id = $2",
      [studentId, jobId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: "You have already applied to this job.",
        applicationId: existing.rows[0].application_id,
      });
    }

    const resume = await query(
      "SELECT extracted_text, parsed_data FROM resumes WHERE student_id = $1 ORDER BY uploaded_at DESC LIMIT 1",
      [studentId]
    );
    if (!resume.rows[0]?.extracted_text) {
      return res.status(400).json({ error: "Upload your resume in your profile before applying." });
    }

    const parsedResume = resume.rows[0].parsed_data || null;

    // Skill overlap matching (no LLM). A match failure must not block the application, so
    // fall back to storing the application without a score.
    let match = null;
    try {
      match = await computeJobMatch(studentId, jobId, parsedResume);
    } catch (error) {
      console.warn("Job match scoring failed; applying without a match score:", error.message);
    }

    const insert = await query(
      `INSERT INTO applications (student_id, job_id, status, match_score, match_details, quiz_status, quiz_passed)
       VALUES ($1, $2, 'Applied', $3, $4, 'Not Started', false)
       RETURNING application_id, student_id, job_id, status, match_score, match_details,
                 quiz_status, quiz_passed, applied_at`,
      [
        studentId,
        jobId,
        match?.matchScore ?? null,
        match
          ? JSON.stringify({
              matchedSkills: match.matchedSkills,
              missingSkills: match.missingSkills,
              requiredSkills: match.requiredSkills,
              candidateSkills: match.candidateSkills,
              explanation: match.explanation,
            })
          : null,
      ]
    );

    const application = insert.rows[0];
    const { job_title: jobTitle, company_name: companyName } = job.rows[0];

    await createNotification(req.user.userId, {
      type: "application_submitted",
      message: `Application submitted for ${jobTitle} at ${companyName}.`,
      link: `/student/status/${application.application_id}`,
    });
    await createNotification(req.user.userId, {
      type: "assessment_ready",
      message: `Screening assessment is available for ${jobTitle}. Score 60% or higher to unlock the interview.`,
      link: `/student/status/${application.application_id}`,
    });
    await notifyRecruitersForApplication(application.application_id, {
      type: "application_submitted",
      message: `New application for ${jobTitle} from a candidate.`,
      link: `/recruiter/candidates/${application.application_id}`,
    });

    return res.status(201).json({
      application,
      match: match
        ? {
            matchScore: match.matchScore,
            matchedSkills: match.matchedSkills,
            missingSkills: match.missingSkills,
            explanation: match.explanation,
          }
        : null,
    });
  } catch (error) {
    // Log full PostgreSQL diagnostics server-side; return an actionable message
    // to the client without leaking schema internals or credentials.
    console.error("Apply error:", { studentId, jobId: req.body?.jobId, ...dbErrorDetails(error) });

    if (error.code === "23505") {
      return res.status(409).json({ error: "You have already applied to this job." });
    }
    if (error.code === "23503") {
      return res.status(400).json({ error: "This job is no longer available." });
    }
    return res.status(500).json({
      error: "Your application could not be saved. Please try again.",
    });
  }
});

router.get("/mine", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    const result = await query(
      `SELECT a.*, j.job_title, j.description, c.company_name,
              latest_interview.status AS interview_status,
              latest_interview.overall_score AS interview_score,
              (a.status = ANY(ARRAY['Shortlisted','Selected'])) AS recruiter_chat_unlocked
       FROM applications a
       JOIN jobs j ON j.job_id = a.job_id
       JOIN companies c ON c.company_id = j.company_id
       LEFT JOIN LATERAL (
         SELECT s.status, s.overall_score
         FROM interview_sessions s
         WHERE s.application_id = a.application_id
         ORDER BY s.interview_date DESC NULLS LAST, s.session_id DESC
         LIMIT 1
       ) latest_interview ON TRUE
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
      [studentId]
    );
    return res.json({ applications: result.rows });
  } catch (error) {
    console.error("Applications mine error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load your applications." });
  }
});

router.get("/:applicationId", requireAuth, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const result = await query(
      `SELECT a.*, j.job_title, j.description, j.location, j.experience_required,
              c.company_name, s.student_id, s.user_id AS student_user_id
       FROM applications a
       JOIN jobs j ON j.job_id = a.job_id
       JOIN companies c ON c.company_id = j.company_id
       JOIN students s ON s.student_id = a.student_id
       WHERE a.application_id = $1`,
      [applicationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Application not found." });
    }

    const application = result.rows[0];
    if (req.user.role === "student" && application.student_user_id !== req.user.userId) {
      return res.status(403).json({ error: "You do not have access to this application." });
    }
    if (req.user.role === "recruiter") {
      const recruiter = await query(
        `SELECT r.recruiter_id
         FROM recruiters r
         JOIN jobs j ON j.company_id = r.company_id
         WHERE r.user_id = $1 AND j.job_id = $2`,
        [req.user.userId, application.job_id]
      );
      if (!recruiter.rows.length) {
        return res.status(403).json({ error: "You do not have access to this application." });
      }
    }

    const latestQuiz = await query(
      `SELECT attempt_id, score, passed, status, completed_at
       FROM quiz_attempts
       WHERE application_id = $1
       ORDER BY completed_at DESC NULLS LAST, started_at DESC
       LIMIT 1`,
      [applicationId]
    );

    const interview = await query(
      `SELECT session_id, status, overall_score, interview_date
       FROM interview_sessions
       WHERE application_id = $1
       ORDER BY interview_date DESC NULLS LAST
       LIMIT 1`,
      [applicationId]
    );

    return res.json({
      application: {
        ...application,
        // Recruiter messaging is gated on this status server-side; the client
        // only mirrors it.
        recruiter_chat_unlocked: ["Shortlisted", "Selected"].includes(application.status),
      },
      latestQuiz: latestQuiz.rows[0] || null,
      interview: interview.rows[0] || null,
      interviewEligible:
        Boolean(application.quiz_passed) &&
        application.status !== "Rejected" &&
        interview.rows[0]?.status !== "Completed",
    });
  } catch (error) {
    console.error("Application detail error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load this application." });
  }
});

router.post("/:applicationId/rematch", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    const { applicationId } = req.params;

    const appResult = await query(
      "SELECT application_id, student_id, job_id FROM applications WHERE application_id = $1",
      [applicationId]
    );
    if (appResult.rows.length === 0) return res.status(404).json({ error: "Application not found." });
    if (appResult.rows[0].student_id !== studentId) {
      return res.status(403).json({ error: "You do not have access to this application." });
    }

    const resume = await query(
      "SELECT parsed_data FROM resumes WHERE student_id = $1 ORDER BY uploaded_at DESC LIMIT 1",
      [studentId]
    );
    const match = await computeJobMatch(studentId, appResult.rows[0].job_id, resume.rows[0]?.parsed_data || null);
    await persistApplicationMatch(applicationId, match);

    return res.json({ match });
  } catch (error) {
    console.error("Rematch error:", error.message);
    return res.status(500).json({ error: error.message || "Unable to recalculate match." });
  }
});

export default router;
