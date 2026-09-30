import { query } from "../db.js";

const RESUME_TEXT_LIMIT = 6000;

function formatList(values, fallback = "Not provided") {
  const items = (Array.isArray(values) ? values : [])
    .map((value) => (typeof value === "string" ? value.trim() : String(value ?? "").trim()))
    .filter(Boolean);
  return items.length > 0 ? items.join(", ") : fallback;
}

function parseJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Builds the Career Assistant's grounding context for one authenticated
 * candidate, entirely from that candidate's own rows.
 *
 * The caller passes a userId taken from the verified JWT and every query is
 * scoped by the student_id resolved from it, so the assistant can never be
 * given another candidate's resume, applications, or scores. Nothing here is
 * hard-coded or sampled.
 */
export async function buildCandidateContext(userId) {
  const studentResult = await query(
    `SELECT s.student_id, s.college_name, s.degree, s.specialization,
            s.graduation_year, s.cgpa, s.city, u.full_name, u.email
     FROM students s
     JOIN users u ON u.user_id = s.user_id
     WHERE s.user_id = $1`,
    [userId]
  );

  const student = studentResult.rows[0];
  if (!student) return null;

  const [resume, skills, applications, experience, recommendedJobs] = await Promise.all([
    query(
      `SELECT r.resume_id, r.resume_name, r.uploaded_at, r.extracted_text, r.parsed_data,
              ra.ats_score, ra.strengths, ra.weaknesses, ra.missing_skills, ra.recommendation
       FROM resumes r
       LEFT JOIN resume_analysis ra ON ra.resume_id = r.resume_id
       WHERE r.student_id = $1
       ORDER BY r.uploaded_at DESC
       LIMIT 1`,
      [student.student_id]
    ),
    query(
      `SELECT sk.skill_name, ss.proficiency_level
       FROM student_skills ss
       JOIN skills sk ON sk.skill_id = ss.skill_id
       WHERE ss.student_id = $1`,
      [student.student_id]
    ),
    query(
      `SELECT a.application_id, a.status, a.match_score, a.quiz_status, a.quiz_passed,
              a.best_quiz_score, a.applied_at, j.job_title, j.location, c.company_name,
              isess.status AS interview_status, isess.overall_score AS interview_score
       FROM applications a
       JOIN jobs j ON j.job_id = a.job_id
       JOIN companies c ON c.company_id = j.company_id
       LEFT JOIN LATERAL (
         SELECT status, overall_score
         FROM interview_sessions
         WHERE application_id = a.application_id
         ORDER BY interview_date DESC NULLS LAST
         LIMIT 1
       ) isess ON true
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
      [student.student_id]
    ),
    query(
      "SELECT company, designation, duration FROM experience WHERE student_id = $1",
      [student.student_id]
    ),
    query(
      `SELECT j.job_title, j.location, j.experience_required, c.company_name
       FROM jobs j
       JOIN companies c ON c.company_id = j.company_id
       WHERE NOT EXISTS (
         SELECT 1 FROM applications a
         WHERE a.job_id = j.job_id AND a.student_id = $1
       )
       ORDER BY j.created_at DESC
       LIMIT 6`,
      [student.student_id]
    ),
  ]);

  const resumeRow = resume.rows[0] || null;
  const parsed = parseJson(resumeRow?.parsed_data);

  return {
    studentId: student.student_id,
    fullName: student.full_name,
    hasResume: Boolean(resumeRow?.extracted_text),
    resumeName: resumeRow?.resume_name ?? null,
    applicationCount: applications.rows.length,
    prompt: renderContextPrompt({
      student,
      resumeRow,
      parsed,
      skills: skills.rows,
      applications: applications.rows,
      experience: experience.rows,
      recommendedJobs: recommendedJobs.rows,
    }),
  };
}

function renderContextPrompt({
  student,
  resumeRow,
  parsed,
  skills,
  applications,
  experience,
  recommendedJobs,
}) {
  const sections = [];

  sections.push(
    [
      "CANDIDATE PROFILE",
      `Name: ${student.full_name}`,
      `Email: ${student.email}`,
      `College: ${student.college_name || "Not provided"}`,
      `Degree: ${student.degree || "Not provided"}${
        student.specialization ? ` (${student.specialization})` : ""
      }`,
      `Graduation year: ${student.graduation_year ?? "Not provided"}`,
      `CGPA: ${student.cgpa ?? "Not provided"}`,
      `City: ${student.city || "Not provided"}`,
    ].join("\n")
  );

  if (parsed) {
    sections.push(
      [
        "RESUME ANALYSIS (extracted from the candidate's uploaded resume)",
        `Target role: ${parsed.targetRole || "Not stated"}`,
        `Years of experience: ${parsed.yearsOfExperience ?? "Not stated"}`,
        `Skills: ${formatList(parsed.skills)}`,
        `Education: ${formatList(parsed.education)}`,
        `Projects: ${formatList(parsed.projects)}`,
        `Experience summary: ${parsed.experience || "Not provided"}`,
      ].join("\n")
    );
  }

  if (resumeRow?.ats_score != null || resumeRow?.strengths || resumeRow?.weaknesses) {
    sections.push(
      [
        "STORED RESUME SCORING",
        `ATS score: ${resumeRow.ats_score ?? "Not scored"}`,
        `Strengths: ${resumeRow.strengths || "Not recorded"}`,
        `Weaknesses: ${resumeRow.weaknesses || "Not recorded"}`,
        `Missing skills: ${resumeRow.missing_skills || "Not recorded"}`,
        `Recommendation: ${resumeRow.recommendation || "Not recorded"}`,
      ].join("\n")
    );
  }

  if (skills.length > 0) {
    sections.push(
      "SKILLS ON PROFILE\n" +
        skills
          .map((row) => `- ${row.skill_name}${row.proficiency_level ? ` (${row.proficiency_level})` : ""}`)
          .join("\n")
    );
  }

  if (experience.length > 0) {
    sections.push(
      "WORK EXPERIENCE\n" +
        experience
          .map((row) => `- ${row.designation || "Role"} at ${row.company || "Company"} (${row.duration || "duration not stated"})`)
          .join("\n")
    );
  }

  if (applications.length > 0) {
    sections.push(
      "APPLICATIONS\n" +
        applications
          .map((row) => {
            const parts = [
              `- ${row.job_title} at ${row.company_name}`,
              `status: ${row.status}`,
              `assessment: ${row.quiz_status}${
                row.best_quiz_score != null ? ` (${row.best_quiz_score}%)` : ""
              }${row.quiz_passed ? ", passed" : ""}`,
            ];
            if (row.match_score != null) parts.push(`match: ${row.match_score}%`);
            if (row.interview_status) {
              parts.push(
                `interview: ${row.interview_status}${
                  row.interview_score != null ? ` (${row.interview_score}%)` : ""
                }`
              );
            }
            return parts.join(" | ");
          })
          .join("\n")
    );
  } else {
    sections.push("APPLICATIONS\nThe candidate has not applied to any job yet.");
  }

  if (recommendedJobs.length > 0) {
    sections.push(
      "OPEN ROLES THE CANDIDATE HAS NOT APPLIED TO\n" +
        recommendedJobs
          .map(
            (row) =>
              `- ${row.job_title} at ${row.company_name} (${row.location || "location not stated"}, ${
                row.experience_required ?? 0
              } yrs)`
          )
          .join("\n")
    );
  }

  if (resumeRow?.extracted_text) {
    sections.push(
      "RESUME FULL TEXT\n" + resumeRow.extracted_text.slice(0, RESUME_TEXT_LIMIT)
    );
  } else {
    sections.push(
      "RESUME FULL TEXT\nThe candidate has not uploaded a resume yet. Say so plainly if asked to review it, and point them to Profile → Resume."
    );
  }

  return sections.join("\n\n");
}
