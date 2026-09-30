-- CareerIQ migration 003 — referential cleanup cascades
--
-- Several child tables reference students/applications/recruiters without
-- ON DELETE CASCADE, so deleting a user fails partway through the cascade with
-- "violates foreign key constraint". That leaves orphaned rows and makes
-- account deletion impossible. These tables are all strictly owned by their
-- parent, so cascading is the correct behaviour.
--
-- Idempotent: each constraint is dropped by name before being recreated.

ALTER TABLE public.recruiter_feedback DROP CONSTRAINT IF EXISTS recruiter_feedback_application_id_fkey;
ALTER TABLE public.recruiter_feedback
    ADD CONSTRAINT recruiter_feedback_application_id_fkey
    FOREIGN KEY (application_id) REFERENCES public.applications(application_id) ON DELETE CASCADE;

ALTER TABLE public.recruiter_feedback DROP CONSTRAINT IF EXISTS recruiter_feedback_recruiter_id_fkey;
ALTER TABLE public.recruiter_feedback
    ADD CONSTRAINT recruiter_feedback_recruiter_id_fkey
    FOREIGN KEY (recruiter_id) REFERENCES public.recruiters(recruiter_id) ON DELETE CASCADE;

ALTER TABLE public.certificates DROP CONSTRAINT IF EXISTS certificates_student_id_fkey;
ALTER TABLE public.certificates
    ADD CONSTRAINT certificates_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;

ALTER TABLE public.experience DROP CONSTRAINT IF EXISTS experience_student_id_fkey;
ALTER TABLE public.experience
    ADD CONSTRAINT experience_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;

ALTER TABLE public.saved_jobs DROP CONSTRAINT IF EXISTS saved_jobs_student_id_fkey;
ALTER TABLE public.saved_jobs
    ADD CONSTRAINT saved_jobs_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;

ALTER TABLE public.saved_jobs DROP CONSTRAINT IF EXISTS saved_jobs_job_id_fkey;
ALTER TABLE public.saved_jobs
    ADD CONSTRAINT saved_jobs_job_id_fkey
    FOREIGN KEY (job_id) REFERENCES public.jobs(job_id) ON DELETE CASCADE;

ALTER TABLE public.interview_sessions DROP CONSTRAINT IF EXISTS interview_sessions_quiz_attempt_id_fkey;
ALTER TABLE public.interview_sessions
    ADD CONSTRAINT interview_sessions_quiz_attempt_id_fkey
    FOREIGN KEY (quiz_attempt_id) REFERENCES public.quiz_attempts(attempt_id) ON DELETE SET NULL;

ALTER TABLE public.recruiters DROP CONSTRAINT IF EXISTS recruiters_company_id_fkey;
ALTER TABLE public.recruiters
    ADD CONSTRAINT recruiters_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES public.companies(company_id) ON DELETE SET NULL;
