-- CareerIQ migration 004 — recruiter workspace fields.
-- Idempotent. Uses existing jobs / companies tables; does not create duplicates.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'open';

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS employment_type varchar(40);

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS work_mode varchar(20);

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS deadline date;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS openings integer DEFAULT 1;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS email varchar(150);

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS logo_url text;

UPDATE jobs SET status = 'open' WHERE status IS NULL;
UPDATE jobs SET openings = 1 WHERE openings IS NULL;
UPDATE jobs SET archived = false WHERE archived IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_status_check'
  ) THEN
    ALTER TABLE jobs
      ADD CONSTRAINT jobs_status_check
      CHECK (status IS NULL OR status IN ('open', 'paused', 'closed'));
  END IF;
END $$;
