/** Shared hiring-pipeline thresholds. Keep quiz and interview gates aligned. */
export const QUIZ_PASS_THRESHOLD = 60;
export const INTERVIEW_PASS_THRESHOLD = 60;

/**
 * Align stored application statuses with quiz/interview outcomes.
 * Legacy rows may still say Applied / Under Review after a failing score.
 */
export async function syncRejectedOutcomes(query) {
  await query(
    `UPDATE applications a
     SET status = 'Rejected'
     WHERE a.status NOT IN ('Shortlisted', 'Selected', 'Rejected')
       AND (
         (a.quiz_status = 'Completed' AND COALESCE(a.quiz_passed, false) = false)
         OR EXISTS (
           SELECT 1
           FROM interview_sessions s
           WHERE s.application_id = a.application_id
             AND s.status = 'Completed'
             AND s.overall_score < $1
         )
       )`,
    [INTERVIEW_PASS_THRESHOLD]
  );
}

export function isFailedOutcome(row) {
  const score = Number(row.interview_score);
  const interviewFailed =
    row.interview_status === "Completed" &&
    Number.isFinite(score) &&
    score < INTERVIEW_PASS_THRESHOLD &&
    row.status !== "Shortlisted" &&
    row.status !== "Selected";
  const quizFailed = row.quiz_passed === false && row.status === "Rejected";
  return row.status === "Rejected" || interviewFailed || quizFailed;
}
