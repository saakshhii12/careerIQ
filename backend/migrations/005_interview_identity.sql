-- Interview identity verification (minimal additions to existing schema).
-- Stores a profile verification photo path + compact face descriptor (not video / raw biometrics dump).
-- Links per-session identity checks to interview_sessions.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS photo_path TEXT,
  ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN IF NOT EXISTS face_descriptor JSONB;

ALTER TABLE public.interview_sessions
  ADD COLUMN IF NOT EXISTS identity_status VARCHAR(30) DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN IF NOT EXISTS identity_match_score NUMERIC(6, 4),
  ADD COLUMN IF NOT EXISTS identity_baseline JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'interview_sessions_identity_status_check'
  ) THEN
    ALTER TABLE public.interview_sessions
      ADD CONSTRAINT interview_sessions_identity_status_check
      CHECK (
        identity_status IS NULL
        OR identity_status IN ('not_started', 'pending', 'passed', 'failed', 'paused')
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.interview_identity_checks (
  check_id BIGSERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES public.interview_sessions(session_id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  match_score NUMERIC(6, 4),
  liveness_passed BOOLEAN DEFAULT false,
  face_count INTEGER,
  details JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interview_identity_checks_session
  ON public.interview_identity_checks(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_students_photo_path
  ON public.students(student_id)
  WHERE photo_path IS NOT NULL;
