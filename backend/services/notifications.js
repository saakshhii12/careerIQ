import { query, dbErrorDetails } from "../db.js";

/**
 * Notification types recognised by the UI. The frontend maps each one to an
 * icon and tone; anything unknown renders as `system`.
 */
export const NOTIFICATION_TYPES = [
  "application_submitted",
  "assessment_ready",
  "assessment_passed",
  "assessment_failed",
  "interview_scheduled",
  "interview_completed",
  "application_result",
  "recruiter_message",
  "system",
];

/**
 * Writes a notification for a user.
 *
 * Notifications are a side effect of a pipeline step, never the point of it, so
 * a failure here is logged and swallowed rather than failing the caller's
 * request — a student should not lose a submitted application because the
 * notification insert failed. The primary operation always reports its own
 * errors.
 */
export async function createNotification(userId, { type = "system", message, link = null }) {
  if (!userId || !message) return null;

  const safeType = NOTIFICATION_TYPES.includes(type) ? type : "system";
  try {
    const result = await query(
      `INSERT INTO notifications (user_id, type, message, link, is_read)
       VALUES ($1, $2, $3, $4, false)
       RETURNING notification_id, user_id, type, message, link, is_read, created_at`,
      [userId, safeType, message, link]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Notification insert failed:", dbErrorDetails(error));
    return null;
  }
}

/** Resolves the users.user_id that owns a student row. */
export async function getUserIdForStudent(studentId) {
  const result = await query("SELECT user_id FROM students WHERE student_id = $1", [studentId]);
  return result.rows[0]?.user_id ?? null;
}

/** Resolves the users.user_id that owns a recruiter row. */
export async function getUserIdForRecruiter(recruiterId) {
  const result = await query("SELECT user_id FROM recruiters WHERE recruiter_id = $1", [recruiterId]);
  return result.rows[0]?.user_id ?? null;
}

/** Notifies every recruiter assigned to a company. Failures are swallowed. */
export async function notifyCompanyRecruiters(companyId, payload) {
  if (!companyId) return;
  try {
    const result = await query("SELECT user_id FROM recruiters WHERE company_id = $1", [companyId]);
    await Promise.all(result.rows.map((row) => createNotification(row.user_id, payload)));
  } catch (error) {
    console.error("notifyCompanyRecruiters failed:", dbErrorDetails(error));
  }
}

/** Notifies recruiters who own the job a given application belongs to. */
export async function notifyRecruitersForApplication(applicationId, payload) {
  if (!applicationId) return;
  try {
    const result = await query(
      `SELECT r.user_id
       FROM applications a
       JOIN jobs j ON j.job_id = a.job_id
       JOIN recruiters r ON r.company_id = j.company_id
       WHERE a.application_id = $1`,
      [applicationId]
    );
    await Promise.all(result.rows.map((row) => createNotification(row.user_id, payload)));
  } catch (error) {
    console.error("notifyRecruitersForApplication failed:", dbErrorDetails(error));
  }
}
