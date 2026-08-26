import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Router } from "express";
import multer from "multer";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { callQwenAPI, extractJson, errorMessage } from "../services/qwen.js";
import { computeJobMatch } from "../services/matching.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "uploads", "resumes");
fs.mkdirSync(uploadDir, { recursive: true });

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

async function getStudentId(userId) {
  const result = await query("SELECT student_id FROM students WHERE user_id = $1", [userId]);
  return result.rows[0]?.student_id || null;
}

async function parseResumeText(resumeText) {
  const prompt = `Extract key information from this resume and return ONLY valid JSON.

Resume:
${resumeText}

Return ONLY this exact JSON structure (use "Not available" if information cannot be extracted):
{
  "candidateName": "extracted name or 'Not available'",
  "targetRole": "extracted target role or job title or 'Not available'",
  "skills": ["skill1", "skill2"],
  "experience": "Brief summary",
  "education": ["degree1"],
  "projects": ["project1"],
  "yearsOfExperience": 0
}

CRITICAL: Do not fabricate information. Only extract what is explicitly in the resume.`;

  const text = await callQwenAPI(prompt);
  return extractJson(text, "object");
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
    });
  } catch (error) {
    console.error("Profile error:", error.message);
    return res.status(500).json({ error: "Unable to load profile." });
  }
});

router.put("/profile", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.userId);
    if (!studentId) return res.status(404).json({ error: "Student profile not found." });

    const { collegeName, degree, specialization, graduationYear, cgpa, phone, city } = req.body;
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
      [studentId, collegeName, degree, specialization, graduationYear, cgpa, phone, city]
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

    const [profile, resume, applications, interviews] = await Promise.all([
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
                j.job_title, j.location, c.company_name
         FROM applications a
         JOIN jobs j ON j.job_id = a.job_id
         JOIN companies c ON c.company_id = j.company_id
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
    ]);

    const resumeData = resume.rows[0] || null;
    const profileComplete = Boolean(
      profile.rows[0]?.college_name &&
        profile.rows[0]?.degree &&
        resumeData?.has_extracted_text
    );

    return res.json({
      profile: profile.rows[0],
      profileComplete,
      resume: resumeData,
      applications: applications.rows.map((row) => ({
        ...row,
        match_details: row.match_details,
        interviewEligible: Boolean(row.quiz_passed),
        stage: row.quiz_passed
          ? "Interview"
          : row.quiz_status === "Completed"
            ? "Quiz Failed"
            : row.match_score != null
              ? "Quiz"
              : "Applied",
      })),
      interviews: interviews.rows,
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);
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
              c.company_name, c.industry
       FROM jobs j
       JOIN companies c ON c.company_id = j.company_id
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

export { parseResumeText, getStudentId };
export default router;
