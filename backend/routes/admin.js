import { Router } from "express";
import bcrypt from "bcrypt";
import { query, dbErrorDetails } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/overview", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const [users, companies, jobs, applications, interviews, quizzes] = await Promise.all([
      query(
        `SELECT
           COUNT(*)::int AS total_users,
           COUNT(*) FILTER (WHERE role = 'student')::int AS students,
           COUNT(*) FILTER (WHERE role = 'recruiter')::int AS recruiters,
           COUNT(*) FILTER (WHERE role = 'admin')::int AS admins
         FROM users`
      ),
      query("SELECT COUNT(*)::int AS companies FROM companies"),
      query(
        `SELECT
           COUNT(*)::int AS total_jobs,
           COUNT(*) FILTER (WHERE COALESCE(status, 'open') = 'open' AND COALESCE(archived, false) = false)::int AS open_jobs
         FROM jobs`
      ),
      query(
        `SELECT
           COUNT(*)::int AS total_applications,
           COUNT(*) FILTER (WHERE status = 'Shortlisted')::int AS shortlisted,
           COUNT(*) FILTER (WHERE status = 'Rejected')::int AS rejected,
           COUNT(*) FILTER (WHERE quiz_passed = true)::int AS quiz_passed
         FROM applications`
      ),
      query(
        `SELECT
           COUNT(*)::int AS total_interviews,
           COUNT(*) FILTER (WHERE status = 'Completed')::int AS completed_interviews
         FROM interview_sessions`
      ),
      query("SELECT COUNT(*)::int AS quiz_attempts FROM quiz_attempts"),
    ]);

    return res.json({
      users: users.rows[0],
      companies: companies.rows[0].companies,
      jobs: jobs.rows[0],
      applications: applications.rows[0],
      interviews: interviews.rows[0],
      quizAttempts: quizzes.rows[0].quiz_attempts,
    });
  } catch (error) {
    console.error("Admin overview error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load admin overview." });
  }
});

router.get("/allotment", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const companies = await query(
      `SELECT c.company_id, c.company_name, c.industry, c.location,
              COALESCE(
                json_agg(
                  json_build_object(
                    'recruiterId', r.recruiter_id,
                    'userId', r.user_id,
                    'name', u.full_name,
                    'email', u.email,
                    'designation', r.designation
                  )
                  ORDER BY r.recruiter_id
                ) FILTER (WHERE r.recruiter_id IS NOT NULL),
                '[]'
              ) AS recruiters
       FROM companies c
       LEFT JOIN recruiters r ON r.company_id = c.company_id
       LEFT JOIN users u ON u.user_id = r.user_id
       GROUP BY c.company_id, c.company_name, c.industry, c.location
       ORDER BY c.company_name`
    );

    const unassigned = await query(
      `SELECT r.recruiter_id, r.user_id, u.full_name, u.email, r.designation
       FROM recruiters r
       JOIN users u ON u.user_id = r.user_id
       WHERE r.company_id IS NULL
       ORDER BY u.full_name`
    );

    return res.json({
      companies: companies.rows.map((row) => ({
        companyId: row.company_id,
        companyName: row.company_name,
        industry: row.industry,
        location: row.location,
        recruiters: row.recruiters,
      })),
      unassignedRecruiters: unassigned.rows.map((row) => ({
        recruiterId: row.recruiter_id,
        userId: row.user_id,
        name: row.full_name,
        email: row.email,
        designation: row.designation,
      })),
    });
  } catch (error) {
    console.error("Admin allotment error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load recruiter allotment." });
  }
});

router.patch("/recruiters/:recruiterId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const companyId = req.body?.companyId === null || req.body?.companyId === ""
      ? null
      : Number(req.body.companyId);
    if (companyId !== null && !Number.isInteger(companyId)) {
      return res.status(400).json({ error: "companyId must be a number or null." });
    }

    const updated = await query(
      `UPDATE recruiters
       SET company_id = $2
       WHERE recruiter_id = $1
       RETURNING recruiter_id, user_id, company_id, designation`,
      [req.params.recruiterId, companyId]
    );
    if (!updated.rows.length) return res.status(404).json({ error: "Recruiter not found." });
    return res.json(updated.rows[0]);
  } catch (error) {
    console.error("Admin assign recruiter error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to assign this recruiter." });
  }
});

router.post("/recruiters", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { fullName, email, password, companyId, designation } = req.body;
    if (!fullName || !email || !password || !companyId) {
      return res.status(400).json({ error: "fullName, email, password, and companyId are required." });
    }

    const company = await query("SELECT company_id FROM companies WHERE company_id = $1", [companyId]);
    if (!company.rows.length) return res.status(404).json({ error: "Company not found." });

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await query("SELECT user_id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rows.length) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const userInsert = await query(
      "INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, 'recruiter') RETURNING user_id, full_name, email, role",
      [String(fullName).trim(), normalizedEmail, hashedPassword]
    );
    const user = userInsert.rows[0];
    const recruiterInsert = await query(
      "INSERT INTO recruiters (user_id, designation, company_id) VALUES ($1, $2, $3) RETURNING recruiter_id",
      [user.user_id, designation || null, Number(companyId)]
    );

    return res.status(201).json({
      recruiterId: recruiterInsert.rows[0].recruiter_id,
      userId: user.user_id,
      name: user.full_name,
      email: user.email,
      companyId: Number(companyId),
    });
  } catch (error) {
    console.error("Admin create recruiter error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to create recruiter." });
  }
});

export default router;
