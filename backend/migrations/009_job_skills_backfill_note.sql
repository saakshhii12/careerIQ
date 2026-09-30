-- Job skill relationships are stored in job_skills (no schema change here).
-- After deploying, run once (idempotent):
--   node scripts/backfill-job-skills.mjs --sync
-- Optional Qwen assist for jobs with sparse descriptions:
--   node scripts/backfill-job-skills.mjs --sync --qwen
SELECT 1;
