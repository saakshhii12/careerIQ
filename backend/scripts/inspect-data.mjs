import dotenv from "dotenv";
import pg from "pg";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const databaseUrl = process.env.DATABASE_URL;
const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl?.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
});

const q = async (label, sql) => {
  const r = await pool.query(sql);
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(r.rows, null, 2));
};

await q("applications.status distinct", "SELECT status, COUNT(*)::int n FROM applications GROUP BY status");
await q("applications.quiz_status distinct", "SELECT quiz_status, quiz_passed, COUNT(*)::int n FROM applications GROUP BY quiz_status, quiz_passed");
await q("interview_sessions.status distinct", "SELECT status, COUNT(*)::int n FROM interview_sessions GROUP BY status");
await q("notifications sample", "SELECT * FROM notifications ORDER BY notification_id LIMIT 10");
await q("quizzes sample", "SELECT quiz_id, job_id, title, passing_score FROM quizzes ORDER BY quiz_id LIMIT 5");
await q("quiz_questions sample", "SELECT quiz_question_id, quiz_id, question_id, LEFT(question,40) q, question_text IS NOT NULL has_qtext, options IS NOT NULL has_options, correct_option, correct_option_index, question_order FROM quiz_questions ORDER BY quiz_question_id LIMIT 5");
await q("test student 33 (Vishakha)", "SELECT s.student_id, s.user_id, u.full_name, u.email FROM students s JOIN users u ON u.user_id=s.user_id WHERE u.user_id IN (33,31,1)");
await q("apps for student 33", "SELECT * FROM applications WHERE student_id = 33");
await q("resume for student 33", "SELECT resume_id, student_id, resume_name, extracted_text IS NOT NULL has_text, parsed_data IS NOT NULL has_parsed FROM resumes WHERE student_id = 33");
await q("recruiters", "SELECT r.recruiter_id, r.user_id, r.company_id, u.full_name, c.company_name FROM recruiters r JOIN users u ON u.user_id=r.user_id LEFT JOIN companies c ON c.company_id=r.company_id");
await q("jobs sample", "SELECT job_id, company_id, job_title, location FROM jobs ORDER BY job_id LIMIT 8");
await q("sequence check applications", "SELECT last_value, is_called FROM applications_application_id_seq");
await q("max application_id", "SELECT MAX(application_id) mx FROM applications");

await pool.end();
