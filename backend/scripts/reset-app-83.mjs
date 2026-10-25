import { query } from "../db.js";

async function resetApp83() {
  await query("UPDATE applications SET status = 'Applied', quiz_status = 'In Progress', quiz_passed = false, best_quiz_score = NULL WHERE application_id = 83");
  await query("UPDATE quiz_attempts SET status = 'In Progress', score = NULL, passed = false, correct_answers = 0, completed_at = NULL WHERE attempt_id = 22");
  await query("DELETE FROM quiz_answers WHERE attempt_id = 22");
  console.log("Reset app 83 and attempt 22 successfully.");
  process.exit(0);
}

resetApp83().catch(err => {
  console.error(err);
  process.exit(1);
});
