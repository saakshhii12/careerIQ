-- Align interview_integrity_events.severity with application vocabulary (info/warning/critical).
-- Idempotent: safe to re-run.

ALTER TABLE public.interview_integrity_events
    DROP CONSTRAINT IF EXISTS interview_integrity_events_severity_check;

UPDATE public.interview_integrity_events SET severity = 'critical' WHERE lower(severity) IN ('high', 'severe');
UPDATE public.interview_integrity_events SET severity = 'warning' WHERE lower(severity) IN ('medium', 'med', 'warn');
UPDATE public.interview_integrity_events SET severity = 'info' WHERE lower(severity) IN ('low');

ALTER TABLE public.interview_integrity_events
    ADD CONSTRAINT interview_integrity_events_severity_check
    CHECK (severity IN ('info', 'warning', 'critical'));
