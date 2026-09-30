-- Tie course cache to a specific application when available (failed-assessment roadmaps).
ALTER TABLE public.student_skill_course_cache
    ADD COLUMN IF NOT EXISTS application_id INTEGER REFERENCES public.applications(application_id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_student_skill_course_cache_app_key
    ON public.student_skill_course_cache (student_id, skill_name, COALESCE(application_id, -1));
