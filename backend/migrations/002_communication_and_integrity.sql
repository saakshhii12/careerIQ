-- CareerIQ migration 002 — sequence repair, quiz compatibility, notifications,
-- and recruiter messaging.
--
-- Idempotent: safe to re-run. Does not delete or rewrite existing rows.
-- Run with: node backend/scripts/migrate.mjs

-- ---------------------------------------------------------------------------
-- 1. Sequence repair
--
-- The seed data was inserted with explicit primary keys, so every owned
-- sequence still points at its initial value. Any INSERT that relies on the
-- sequence default therefore produces an id that already exists and fails with
-- "duplicate key value violates unique constraint". This resets every sequence
-- in the public schema to MAX(id), which fixes registration, job application,
-- resume upload, notifications, and interview session creation at once.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    rec RECORD;
    max_id BIGINT;
BEGIN
    FOR rec IN
        SELECT seq.relname   AS seq_name,
               tab.relname   AS table_name,
               col.attname   AS column_name
        FROM pg_class seq
        JOIN pg_depend d      ON d.objid = seq.oid AND d.deptype = 'a'
        JOIN pg_class tab     ON tab.oid = d.refobjid
        JOIN pg_attribute col ON col.attrelid = tab.oid AND col.attnum = d.refobjsubid
        JOIN pg_namespace n   ON n.oid = seq.relnamespace
        WHERE seq.relkind = 'S' AND n.nspname = 'public'
    LOOP
        EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM public.%I', rec.column_name, rec.table_name)
            INTO max_id;

        IF max_id > 0 THEN
            EXECUTE format('SELECT setval(%L, %s, true)', 'public.' || rec.seq_name, max_id);
        ELSE
            EXECUTE format('SELECT setval(%L, 1, false)', 'public.' || rec.seq_name);
        END IF;
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Application integrity and status vocabulary
--
-- A student must not be able to hold two applications for the same job, and
-- the pipeline needs an "Under Review" state between interview completion and
-- the recruiter's shortlist decision. Recruiter chat unlocks at 'Shortlisted',
-- so the interview must NOT set that status by itself.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT student_id, job_id
        FROM public.applications
        GROUP BY student_id, job_id
        HAVING COUNT(*) > 1
    ) dupes;

    IF duplicate_count = 0 THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname = 'public' AND indexname = 'uq_applications_student_job'
        ) THEN
            CREATE UNIQUE INDEX uq_applications_student_job
                ON public.applications (student_id, job_id);
        END IF;
    ELSE
        RAISE NOTICE 'Skipping uq_applications_student_job: % duplicate (student_id, job_id) pairs exist.', duplicate_count;
    END IF;
END $$;

ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE public.applications
    ADD CONSTRAINT applications_status_check CHECK (
        status IN (
            'Applied',
            'Interview Scheduled',
            'Under Review',
            'Shortlisted',
            'Selected',
            'Rejected'
        )
    );

-- ---------------------------------------------------------------------------
-- 3. Quiz schema compatibility
--
-- This database carries an older quiz shape (quiz_id + option_a..option_d +
-- correct_option) alongside the application-scoped shape the app writes
-- (attempt_id + question_text + options JSONB + correct_option_index). The
-- legacy columns are NOT NULL with no default, so every INSERT from
-- routes/quiz.js failed. Relax the legacy columns instead of dropping them so
-- the 20 existing legacy rows keep working.
-- ---------------------------------------------------------------------------
ALTER TABLE public.quiz_questions ALTER COLUMN quiz_id          DROP NOT NULL;
ALTER TABLE public.quiz_questions ALTER COLUMN question         DROP NOT NULL;
ALTER TABLE public.quiz_questions ALTER COLUMN option_a         DROP NOT NULL;
ALTER TABLE public.quiz_questions ALTER COLUMN option_b         DROP NOT NULL;
ALTER TABLE public.quiz_questions ALTER COLUMN option_c         DROP NOT NULL;
ALTER TABLE public.quiz_questions ALTER COLUMN option_d         DROP NOT NULL;
ALTER TABLE public.quiz_questions ALTER COLUMN correct_option   DROP NOT NULL;

ALTER TABLE public.quiz_attempts  ALTER COLUMN quiz_id          DROP NOT NULL;

ALTER TABLE public.quiz_answers   ALTER COLUMN quiz_question_id DROP NOT NULL;

-- The existing unique index is on (attempt_id, quiz_question_id), which is
-- always NULL for application-scoped attempts. Answers are keyed by question_id
-- in the new shape, so ON CONFLICT needs a matching index.
CREATE UNIQUE INDEX IF NOT EXISTS uq_quiz_answers_attempt_question
    ON public.quiz_answers (attempt_id, question_id);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_attempt
    ON public.quiz_questions (attempt_id, question_order);

-- ---------------------------------------------------------------------------
-- 3b. Interview session status casing
--
-- Seed rows use 'scheduled' while the application writes 'In Progress' and
-- 'Completed'. Normalise the stored values and the default so status checks in
-- routes/interview.js and routes/recruiter.js compare consistently.
-- ---------------------------------------------------------------------------
UPDATE public.interview_sessions SET status = 'Scheduled'   WHERE lower(status) = 'scheduled';
UPDATE public.interview_sessions SET status = 'In Progress' WHERE lower(status) = 'in progress';
UPDATE public.interview_sessions SET status = 'Completed'   WHERE lower(status) = 'completed';
ALTER TABLE public.interview_sessions ALTER COLUMN status SET DEFAULT 'Scheduled';

-- Answers are upserted per question when an interview is submitted, so
-- question_id needs a unique index for ON CONFLICT to work.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND indexname = 'uq_interview_answers_question'
    ) AND NOT EXISTS (
        SELECT 1 FROM public.interview_answers
        GROUP BY question_id HAVING COUNT(*) > 1
    ) THEN
        CREATE UNIQUE INDEX uq_interview_answers_question
            ON public.interview_answers (question_id);
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Notifications
--
-- Reuse the existing notifications table. It already has user_id / message /
-- is_read / created_at; these two additive columns let the UI pick an icon and
-- deep-link to the right page without inventing a second table.
-- ---------------------------------------------------------------------------
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type VARCHAR(40) DEFAULT 'system';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link VARCHAR(255);
UPDATE public.notifications SET type = 'system' WHERE type IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON public.notifications (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 5. Recruiter messaging
--
-- No messaging table existed. A conversation is scoped to one application,
-- which transitively pins the candidate, the recruiter's company, and the job,
-- so a candidate can never be routed to the wrong recruiter. Access is gated
-- on applications.status = 'Shortlisted' in the API layer.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recruiter_conversations (
    conversation_id BIGSERIAL PRIMARY KEY,
    application_id  INTEGER NOT NULL REFERENCES public.applications(application_id) ON DELETE CASCADE,
    student_id      INTEGER NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
    recruiter_id    INTEGER NOT NULL REFERENCES public.recruiters(recruiter_id) ON DELETE CASCADE,
    job_id          INTEGER NOT NULL REFERENCES public.jobs(job_id) ON DELETE CASCADE,
    created_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_recruiter_conversations_application
    ON public.recruiter_conversations (application_id);

CREATE TABLE IF NOT EXISTS public.recruiter_messages (
    message_id      BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES public.recruiter_conversations(conversation_id) ON DELETE CASCADE,
    sender_role     VARCHAR(20) NOT NULL CHECK (sender_role IN ('student', 'recruiter', 'system')),
    sender_user_id  INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
    body            TEXT NOT NULL,
    read_at         TIMESTAMP WITHOUT TIME ZONE,
    created_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recruiter_messages_conversation
    ON public.recruiter_messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- 6. Career Assistant conversation indexes
--
-- chatbot_conversations / chatbot_messages already exist and are the right
-- home for the AI assistant. Only indexes are missing.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user
    ON public.chatbot_conversations (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation
    ON public.chatbot_messages (conversation_id, created_at);
