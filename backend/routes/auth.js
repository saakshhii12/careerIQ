import { Router } from "express";
import bcrypt from "bcrypt";
import { query } from "../db.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();

async function verifyPassword(storedPassword, inputPassword) {
  if (storedPassword.startsWith("$2")) {
    return bcrypt.compare(inputPassword, storedPassword);
  }
  return storedPassword === inputPassword;
}

async function loadUserContext(userId) {
  const userResult = await query(
    "SELECT user_id, full_name, email, role, created_at FROM users WHERE user_id = $1",
    [userId]
  );
  if (userResult.rows.length === 0) return null;

  const user = userResult.rows[0];
  let profile = null;

  if (user.role === "student") {
    const studentResult = await query("SELECT * FROM students WHERE user_id = $1", [userId]);
    profile = studentResult.rows[0] || null;
  } else if (user.role === "recruiter") {
    const recruiterResult = await query(
      `SELECT r.*, c.company_name
       FROM recruiters r
       LEFT JOIN companies c ON c.company_id = r.company_id
       WHERE r.user_id = $1`,
      [userId]
    );
    profile = recruiterResult.rows[0] || null;
  } else if (user.role === "admin") {
    const adminResult = await query("SELECT * FROM admins WHERE user_id = $1", [userId]);
    profile = adminResult.rows[0] || null;
  }

  return { ...user, profile };
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const result = await query("SELECT user_id, password, role FROM users WHERE email = $1", [
      email.trim().toLowerCase(),
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const row = result.rows[0];
    const valid = await verifyPassword(row.password, password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = await loadUserContext(row.user_id);
    const token = signToken({ userId: user.user_id, role: user.role, email: user.email });
    return res.json({ token, user });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ error: "Unable to sign in right now." });
  }
});

router.post("/register", async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      role = "student",
      collegeName,
      degree,
      specialization,
      graduationYear,
      phone,
      city,
      designation,
      companyId,
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "Full name, email, and password are required." });
    }
    if (!["student", "recruiter"].includes(role)) {
      return res.status(400).json({ error: "Role must be student or recruiter." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await query("SELECT user_id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userInsert = await query(
      "INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING user_id, full_name, email, role, created_at",
      [fullName.trim(), normalizedEmail, hashedPassword, role]
    );
    const user = userInsert.rows[0];

    if (role === "student") {
      await query(
        `INSERT INTO students (user_id, college_name, degree, specialization, graduation_year, phone, city)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user.user_id, collegeName || null, degree || null, specialization || null, graduationYear || null, phone || null, city || null]
      );
    } else {
      if (!companyId) {
        return res.status(400).json({ error: "Select the company you recruit for." });
      }
      await query(
        "INSERT INTO recruiters (user_id, designation, phone, company_id) VALUES ($1, $2, $3, $4)",
        [user.user_id, designation || null, phone || null, companyId]
      );
    }

    const fullUser = await loadUserContext(user.user_id);
    const token = signToken({ userId: user.user_id, role: user.role, email: user.email });
    return res.status(201).json({ token, user: fullUser });
  } catch (error) {
    console.error("Register error:", error.message);
    return res.status(500).json({ error: "Unable to create account right now." });
  }
});

router.get("/companies", async (_req, res) => {
  try {
    const result = await query(
      "SELECT company_id, company_name, industry, location FROM companies ORDER BY company_name"
    );
    return res.json({
      companies: result.rows.map((row) => ({
        companyId: row.company_id,
        companyName: row.company_name,
        industry: row.industry,
        location: row.location,
      })),
    });
  } catch (error) {
    console.error("Companies list error:", error.message);
    return res.status(500).json({ error: "Unable to load companies." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await loadUserContext(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    return res.json({ user });
  } catch (error) {
    console.error("Auth me error:", error.message);
    return res.status(500).json({ error: "Unable to load your account." });
  }
});

export default router;
