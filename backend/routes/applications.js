import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { computeJobMatch, persistApplicationMatch } from "../services/matching.js";
import { getStudentId } from "./candidate.js";

const router = Router();

router.post("/", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    if (!studentId) return res.status(404).json({ error: "Student profile not found." });

    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ error: "jobId is required." });

    const existing = await query(
      "SELECT application_id FROM applications WHERE student_id = $1 AND job_id = $2",
      [studentId, jobId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "You have already applied to this job." });
    }

    const resume = await query(
      "SELECT extracted_text, parsed_data FROM resumes WHERE student_id = $1 ORDER BY uploaded_at DESC LIMIT 1",
      [studentId]
    );
    if (!resume.rows[0]?.extracted_text) {
      return res.status(400).json({ error: "Upload your resume in your profile before applying." });
    }

    const parsedResume = resume.rows[0].parsed_data || null;
    const match = await computeJobMatch(studentId, jobId, parsedResume);

    const insert = await query(
      `INSERT INTO applications (student_id, job_id, status, match_score, match_details, quiz_status)
       VALUES ($1, $2, 'Applied', $3, $4, 'Not Started')
       RETURNING application_id, student_id, job_id, status, match_score, match_details, quiz_status, quiz_passed, applied_at`,
      [studentId, jobId, match.matchScore, JSON.stringify({
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        requiredSkills: match.requiredSkills,
        candidateSkills: match.candidateSkills,
        explanation: match.explanation,
      })]
    );

    return res.status(201).json({
      application: insert.rows[0],
      match: {
        matchScore: match.matchScore,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        explanation: match.explanation,
      },
    });
  } catch (error) {
    console.error("Apply error:", error.message);
    return res.status(500).json({ error: error.message || "Unable to submit application." });
  }
});

router.get("/mine", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    const result = await query(
      `SELECT a.*, j.job_title, j.description, c.company_name
       FROM applications a
       JOIN jobs j ON j.job_id = a.job_id
       JOIN companies c ON c.company_id = j.company_id
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
      [studentId]
    );
    return res.json({ applications: result.rows });
  } catch (error) {
    console.error("Applications mine error:", error.message);
    return res.status(500).json({ error: "Unable to load applications." });
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
      application,
      latestQuiz: latestQuiz.rows[0] || null,
      interview: interview.rows[0] || null,
      interviewEligible: Boolean(application.quiz_passed),
    });
  } catch (error) {
    console.error("Application detail error:", error.message);
    return res.status(500).json({ error: "Unable to load application." });
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
