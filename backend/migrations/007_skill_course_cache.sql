-- Cache dynamic course search results per student + skill (+ optional job context).
-- Idempotent.

CREATE TABLE IF NOT EXISTS public.student_skill_course_cache (
    cache_id BIGSERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
    skill_name VARCHAR(120) NOT NULL,
    job_id INTEGER REFERENCES public.jobs(job_id) ON DELETE SET NULL,
    courses JSONB NOT NULL DEFAULT '[]'::jsonb,
    searched_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_student_skill_course_cache_key
    ON public.student_skill_course_cache (student_id, skill_name, COALESCE(job_id, -1));

CREATE INDEX IF NOT EXISTS idx_student_skill_course_cache_student
    ON public.student_skill_course_cache (student_id, searched_at DESC);
