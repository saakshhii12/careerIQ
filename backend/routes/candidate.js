import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Router } from "express";
import multer from "multer";
import { query, dbErrorDetails } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { errorMessage } from "../services/qwen.js";
import { parseResumeText } from "../services/resume-ai.js";
import { upsertResumeAnalysis } from "../services/resume-analysis-ai.js";
import { getCourseRecommendationsForSkill } from "../services/course-recommendations.js";
import { computeJobMatch } from "../services/matching.js";
import {
  assertApplicationQuizFailed,
  assertSkillRequiredForJob,
  listFailedQuizSkillGaps,
} from "../services/skill-gap.js";
import { QUIZ_PASS_THRESHOLD } from "../services/pipeline.js";
import { isValidDescriptor } from "../services/identity.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "uploads", "resumes");
const photoDir = path.join(__dirname, "..", "uploads", "photos");
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(photoDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${Date.now()}_${safeName}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF resumes are supported."));
      return;
    }
    cb(null, true);
  },
});

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, photoDir),
    filename: (_req, file, cb) => {
      const ext = file.mimetype === "image/png" ? "png" : "jpg";
      cb(null, `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`);
    },
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, or WebP photos are supported."));
      return;
    }
    cb(null, true);
  },
});

async function getStudentId(userId) {
  const result = await query("SELECT student_id FROM students WHERE user_id = $1", [userId]);
  return result.rows[0]?.student_id || null;
}

router.get("/profile", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    if (!studentId) return res.status(404).json({ error: "Student profile not found." });

    const [student, resume, skills] = await Promise.all([
      query(
        `SELECT s.*, u.full_name, u.email
         FROM students s
         JOIN users u ON u.user_id = s.user_id
         WHERE s.student_id = $1`,
        [studentId]
      ),
      query(
        `SELECT resume_id, resume_name, resume_path, uploaded_at, parsed_data,
                CASE WHEN extracted_text IS NOT NULL THEN true ELSE false END AS has_extracted_text
         FROM resumes
         WHERE student_id = $1
         ORDER BY uploaded_at DESC
         LIMIT 1`,
        [studentId]
      ),
      query(
        `SELECT s.skill_name, ss.proficiency_level
         FROM student_skills ss
         JOIN skills s ON s.skill_id = ss.skill_id
         WHERE ss.student_id = $1`,
        [studentId]
      ),
    ]);

    return res.json({
      profile: student.rows[0],
      resume: resume.rows[0] || null,
      skills: skills.rows,
      identity: {
        hasPhoto: Boolean(student.rows[0]?.photo_path),
        hasFaceDescriptor: Boolean(student.rows[0]?.face_descriptor),
        photoUploadedAt: student.rows[0]?.photo_uploaded_at || null,
      },
    });
  } catch (error) {
    console.error("Profile error:", error.message);
    return res.status(500).json({ error: "Unable to load profile." });
  }
});

router.post(
  "/photo",
  requireAuth,
  requireRole("student"),
  photoUpload.single("photo"),
  async (req, res) => {
    try {
      const studentId = await getStudentId(req.user.userId);
      if (!studentId) return res.status(404).json({ error: "Student profile not found." });
      if (!req.file) return res.status(400).json({ error: "A verification photo is required." });

      let descriptor = null;
      if (req.body?.faceDescriptor) {
        try {
          descriptor =
            typeof req.body.faceDescriptor === "string"
              ? JSON.parse(req.body.faceDescriptor)
              : req.body.faceDescriptor;
        } catch {
          descriptor = null;
        }
      }
      if (descriptor && !isValidDescriptor(descriptor)) {
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({ error: "Invalid face descriptor." });
      }

      const relativePath = `/uploads/photos/${req.file.filename}`;
      const existing = await query("SELECT photo_path FROM students WHERE student_id = $1", [studentId]);
      const previousPath = existing.rows[0]?.photo_path;
      if (previousPath) {
        const absolute = path.join(__dirname, "..", previousPath.replace(/^\//, ""));
        fs.unlink(absolute, () => {});
      }

      await query(
        `UPDATE students
         SET photo_path = $2,
             photo_uploaded_at = CURRENT_TIMESTAMP,
             face_descriptor = COALESCE($3::jsonb, face_descriptor)
         WHERE student_id = $1`,
        [studentId, relativePath, descriptor ? JSON.stringify(descriptor) : null]
      );

      return res.status(201).json({
        photoPath: relativePath,
        hasFaceDescriptor: Boolean(descriptor) || Boolean(existing.rows[0]?.face_descriptor),
        uploadedAt: new Date().toISOString(),
      });
    } catch (error) {
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      console.error("Photo upload error:", error.message);
      return res.status(500).json({ error: error.message || "Unable to upload verification photo." });
    }
  }
);

router.put("/face-descriptor", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    if (!studentId) return res.status(404).json({ error: "Student profile not found." });
    const descriptor = req.body?.faceDescriptor;
    if (!isValidDescriptor(descriptor)) {
      return res.status(400).json({ error: "A valid face descriptor is required." });
    }
    await query("UPDATE students SET face_descriptor = $2 WHERE student_id = $1", [
      studentId,
      JSON.stringify(descriptor),
    ]);
    return res.json({ stored: true });
  } catch (error) {
    console.error("Face descriptor update error:", error.message);
    return res.status(500).json({ error: "Unable to store face descriptor." });
  }
});

router.put("/profile", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    if (!studentId) return res.status(404).json({ error: "Student profile not found." });

    const {
      fullName,
      collegeName,
      degree,
      specialization,
      graduationYear,
      cgpa,
      phone,
      city,
    } = req.body;

    if (fullName != null && String(fullName).trim()) {
      await query("UPDATE users SET full_name = $2 WHERE user_id = $1", [
        req.user.userId,
        String(fullName).trim(),
      ]);
    }

    await query(
      `UPDATE students
       SET college_name = COALESCE($2, college_name),
           degree = COALESCE($3, degree),
           specialization = COALESCE($4, specialization),
           graduation_year = COALESCE($5, graduation_year),
           cgpa = COALESCE($6, cgpa),
           phone = COALESCE($7, phone),
           city = COALESCE($8, city)
       WHERE student_id = $1`,
      [
        studentId,
        collegeName ?? null,
        degree ?? null,
        specialization ?? null,
        graduationYear ?? null,
        cgpa ?? null,
        phone ?? null,
        city ?? null,
      ]
    );

    const updated = await query(
      `SELECT s.*, u.full_name, u.email
       FROM students s
       JOIN users u ON u.user_id = s.user_id
       WHERE s.student_id = $1`,
      [studentId]
    );
    return res.json({ profile: updated.rows[0] });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({ error: "Unable to update profile." });
  }
});

router.post("/resume", requireAuth, requireRole("student"), upload.single("resume"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    if (!studentId) return res.status(404).json({ error: "Student profile not found." });
    if (!req.file) return res.status(400).json({ error: "A PDF resume file is required." });

    const { extractedText } = req.body;
    if (!extractedText?.trim()) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: "Resume text extraction failed. Upload a text-based PDF." });
    }

    let parsedData = null;
    try {
      parsedData = await parseResumeText(extractedText);
    } catch (error) {
      console.warn("Resume parsing failed:", error.message);
    }

    const relativePath = `/uploads/resumes/${req.file.filename}`;
    const existing = await query("SELECT resume_id FROM resumes WHERE student_id = $1 LIMIT 1", [studentId]);

    let resumeRow;
    if (existing.rows.length > 0) {
      const update = await query(
        `UPDATE resumes
         SET resume_name = $2,
             resume_path = $3,
             extracted_text = $4,
             parsed_data = $5,
             uploaded_at = CURRENT_TIMESTAMP
         WHERE resume_id = $1
         RETURNING *`,
        [existing.rows[0].resume_id, req.file.originalname, relativePath, extractedText, parsedData ? JSON.stringify(parsedData) : null]
      );
      resumeRow = update.rows[0];
    } else {
      const insert = await query(
        `INSERT INTO resumes (student_id, resume_name, resume_path, extracted_text, parsed_data)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [studentId, req.file.originalname, relativePath, extractedText, parsedData ? JSON.stringify(parsedData) : null]
      );
      resumeRow = insert.rows[0];
    }

    try {
      await upsertResumeAnalysis(resumeRow.resume_id, extractedText, parsedData);
    } catch (error) {
      console.warn("Resume analysis persistence failed:", error.message);
    }

    return res.json({
      resume: {
        resume_id: resumeRow.resume_id,
        resume_name: resumeRow.resume_name,
        uploaded_at: resumeRow.uploaded_at,
        parsed_data: resumeRow.parsed_data,
        has_extracted_text: Boolean(resumeRow.extracted_text),
      },
      parsedData,
    });
  } catch (error) {
    console.error("Resume upload error:", error.message);
    return res.status(500).json({ error: errorMessage(error) });
  }
});

router.get("/dashboard", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    if (!studentId) return res.status(404).json({ error: "Student profile not found." });

    const [profile, resume, applications, interviews, notifications] = await Promise.all([
      query(
        `SELECT s.*, u.full_name, u.email FROM students s JOIN users u ON u.user_id = s.user_id WHERE s.student_id = $1`,
        [studentId]
      ),
      query(
        `SELECT resume_id, resume_name, uploaded_at, parsed_data,
                CASE WHEN extracted_text IS NOT NULL THEN true ELSE false END AS has_extracted_text
         FROM resumes WHERE student_id = $1 ORDER BY uploaded_at DESC LIMIT 1`,
        [studentId]
      ),
      query(
        `SELECT a.application_id, a.job_id, a.status, a.match_score, a.match_details,
                a.quiz_status, a.quiz_passed, a.best_quiz_score, a.applied_at,
                j.job_title, j.location, c.company_name,
                isess.session_id, isess.status AS interview_status, isess.overall_score AS interview_score
         FROM applications a
         JOIN jobs j ON j.job_id = a.job_id
         JOIN companies c ON c.company_id = j.company_id
         LEFT JOIN LATERAL (
           SELECT session_id, status, overall_score
           FROM interview_sessions
           WHERE application_id = a.application_id
           ORDER BY interview_date DESC NULLS LAST
           LIMIT 1
         ) isess ON true
         WHERE a.student_id = $1
         ORDER BY a.applied_at DESC`,
        [studentId]
      ),
      query(
        `SELECT isess.session_id, isess.application_id, isess.status, isess.overall_score,
                isess.interview_date, j.job_title, c.company_name
         FROM interview_sessions isess
         JOIN applications a ON a.application_id = isess.application_id
         JOIN jobs j ON j.job_id = a.job_id
         JOIN companies c ON c.company_id = j.company_id
         WHERE a.student_id = $1
         ORDER BY isess.interview_date DESC NULLS LAST`,
        [studentId]
      ),
      query(
        `SELECT notification_id, type, message, link, is_read, created_at
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC, notification_id DESC
         LIMIT 20`,
        [req.user.userId]
      ),
    ]);

    const resumeData = resume.rows[0] || null;
    const profileComplete = Boolean(
      profile.rows[0]?.college_name &&
        profile.rows[0]?.degree &&
        resumeData?.has_extracted_text
    );

    const mapped = applications.rows.map((row) => ({
      ...row,
      interviewEligible: Boolean(row.quiz_passed) && row.status !== "Rejected",
      // Recruiter chat unlocks only after a passing interview (Shortlisted)
      // or a later Selected decision. Keep in sync with UNLOCKED_STATUSES.
      recruiterChatUnlocked: ["Shortlisted", "Selected"].includes(row.status),
    }));

    return res.json({
      profile: profile.rows[0],
      profileComplete,
      resume: resumeData,
      applications: mapped,
      interviews: interviews.rows,
      notifications: notifications.rows.map((row) => ({
        id: String(row.notification_id),
        type: row.type || "system",
        message: row.message,
        link: row.link || null,
        read: Boolean(row.is_read),
        createdAt: row.created_at,
      })),
      recruiterChatUnlockedCount: mapped.filter((row) => row.recruiterChatUnlocked).length,
    });
  } catch (error) {
    console.error("Dashboard error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load dashboard." });
  }
});

router.get("/jobs", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    const resume = await query(
      "SELECT parsed_data FROM resumes WHERE student_id = $1 ORDER BY uploaded_at DESC LIMIT 1",
      [studentId]
    );
    const parsedResume = resume.rows[0]?.parsed_data || null;

    const jobsResult = await query(
      `SELECT j.job_id, j.job_title, j.description, j.location, j.experience_required,
              j.salary_min, j.salary_max, j.salary_type, j.created_at,
              j.employment_type, j.work_mode, j.deadline, j.openings, j.status,
              c.company_name, c.industry,
              (
                SELECT COUNT(*)::int
                FROM applications a
                WHERE a.job_id = j.job_id
              ) AS applicants_count
       FROM jobs j
       JOIN companies c ON c.company_id = j.company_id
       WHERE COALESCE(j.archived, false) = false
         AND COALESCE(j.status, 'open') = 'open'
       ORDER BY j.created_at DESC`
    );

    const applications = await query(
      "SELECT job_id, application_id, quiz_passed, quiz_status, match_score FROM applications WHERE student_id = $1",
      [studentId]
    );
    const applicationMap = new Map(applications.rows.map((row) => [row.job_id, row]));

    const jobs = [];
    for (const job of jobsResult.rows) {
      const existingApplication = applicationMap.get(job.job_id);
      let match = null;
      if (!existingApplication) {
        match = await computeJobMatch(studentId, job.job_id, parsedResume);
      }
      jobs.push({
        ...job,
        application: existingApplication || null,
        previewMatch: match
          ? {
              matchScore: match.matchScore,
              matchedSkills: match.matchedSkills,
              missingSkills: match.missingSkills,
              explanation: match.explanation,
            }
          : null,
      });
    }

    return res.json({ jobs });
  } catch (error) {
    console.error("Jobs list error:", error.message);
    return res.status(500).json({ error: "Unable to load jobs." });
  }
});

router.get("/skill-gaps", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    if (!studentId) return res.status(404).json({ error: "Student profile not found." });

    const applicationId = req.query.applicationId ? Number(req.query.applicationId) : null;
    if (applicationId && !Number.isInteger(applicationId)) {
      return res.status(400).json({ error: "Invalid applicationId." });
    }

    const applications = await listFailedQuizSkillGaps(studentId, applicationId || null);

    return res.json({
      quizPassThreshold: QUIZ_PASS_THRESHOLD,
      applications,
    });
  } catch (error) {
    console.error("Skill gaps error:", error.message);
    return res.status(error.status || 500).json({ error: error.message || "Unable to load skill gaps." });
  }
});

router.get("/skill-courses", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    if (!studentId) return res.status(404).json({ error: "Student profile not found." });

    const skill = String(req.query.skill || "").trim();
    if (!skill) return res.status(400).json({ error: "skill is required." });

    const refresh = String(req.query.refresh || "") === "true";
    const applicationId = req.query.applicationId ? Number(req.query.applicationId) : null;
    if (!applicationId || !Number.isInteger(applicationId)) {
      return res.status(400).json({ error: "applicationId is required for course recommendations." });
    }

    const appRow = await assertApplicationQuizFailed(studentId, applicationId);
    await assertSkillRequiredForJob(appRow.job_id, skill);

    const result = await getCourseRecommendationsForSkill({
      studentId,
      skillName: skill,
      targetRole: appRow.job_title,
      jobId: appRow.job_id,
      applicationId,
      refresh,
    });
    return res.json(result);
  } catch (error) {
    console.error("Skill courses error:", error.message);
    if (error.status === 503) {
      return res.status(503).json({ error: "Learning resources are temporarily unavailable." });
    }
    return res.status(error.status || 500).json({ error: error.message || "Unable to load courses." });
  }
});

export { parseResumeText, getStudentId };
export default router;
