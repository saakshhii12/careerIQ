"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, LoaderCircle, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ApplicationRoadmap,
  CourseRecommendation,
  getSkillCourses,
  getSkillGaps,
} from "@/lib/api/skill-courses";
import { ApiError } from "@/lib/api/client";

function freeTone(status: CourseRecommendation["freeStatus"]) {
  if (status === "FREE") return "success" as const;
  if (status === "FREE_AUDIT") return "warning" as const;
  return "neutral" as const;
}

function coursesErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 503) return "Learning resources are temporarily unavailable.";
    return err.message;
  }
  return err instanceof Error ? err.message : "Unable to load courses.";
}

function SkillCoursesPanel({
  applicationId,
  skill,
}: {
  applicationId: string;
  skill: string;
}) {
  const [courses, setCourses] = useState<CourseRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      setLoading(true);
      setError(null);
      try {
        const result = await getSkillCourses(skill, { applicationId, refresh });
        setCourses(result.courses.slice(0, 5));
      } catch (err) {
        setError(coursesErrorMessage(err));
        setCourses([]);
      } finally {
        setLoading(false);
      }
    },
    [applicationId, skill]
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  return (
    <div className="mt-2 space-y-3">
      {loading && (
        <p className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <LoaderCircle size={14} className="animate-spin" /> Finding free courses…
        </p>
      )}
      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      {!loading && !error && (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" disabled={loading} onClick={() => load(true)}>
            <RefreshCw size={13} /> Refresh
          </Button>
        </div>
      )}
      {!loading && !error && courses.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)]">
          No suitable free courses were found for this skill.
        </p>
      )}
      <div className="flex flex-col gap-3">
        {courses.map((course, index) => (
          <div
            key={course.url}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-3"
          >
            <p className="text-xs text-[var(--color-text-faint)]">{index + 1}.</p>
            <div className="mt-1 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">{course.title}</p>
                <p className="text-xs text-[var(--color-text-faint)]">{course.provider}</p>
              </div>
              <Badge tone={freeTone(course.freeStatus)}>{course.freeStatusLabel}</Badge>
            </div>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{course.description}</p>
            <a
              href={course.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent-dim)] hover:underline"
            >
              Start course <ExternalLink size={13} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function learningSkillList(app: ApplicationRoadmap) {
  if (app.learningSkills?.length) return app.learningSkills;
  return app.skills;
}

function RoadmapApplicationCard({ app }: { app: ApplicationRoadmap }) {
  const scoreLine =
    app.quizScore != null
      ? `${app.quizScore}% / ${app.quizPassThreshold}%`
      : `— / ${app.quizPassThreshold}%`;

  const forLearning = learningSkillList(app);

  return (
    <GlassCard className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--color-text)]">{app.jobTitle}</h3>
        {app.companyName && (
          <p className="text-sm text-[var(--color-text-muted)]">{app.companyName}</p>
        )}
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Assessment: <span className="font-medium text-[var(--color-danger)]">Failed</span>
          <span className="mx-2 text-[var(--color-text-faint)]">·</span>
          {scoreLine}
        </p>
      </div>

      <p className="text-sm text-[var(--color-text-muted)]">{app.intro}</p>

      {app.noJobSkills ? (
        <p className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-3 text-sm text-[var(--color-text-muted)]">
          The recruiter has not listed required skills for this job yet.
        </p>
      ) : (
        <>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
              Required skills
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {app.skills.map(({ skill, demonstrated }) => (
                <Badge key={skill} tone={demonstrated ? "success" : "neutral"}>
                  {skill}
                  {demonstrated ? " ✓" : ""}
                </Badge>
              ))}
            </div>
          </div>

          {(app.matchedSkills?.length ?? 0) > 0 && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Already reflected in your profile: {app.matchedSkills!.join(", ")}
            </p>
          )}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
              Recommended learning
            </p>
            <ul className="mt-3 flex flex-col gap-4">
              {forLearning.map(({ skill }) => (
                <li key={skill} className="border-t border-[var(--color-border)] pt-3 first:border-0 first:pt-0">
                  <p className="text-sm font-semibold text-[var(--color-text)]">{skill}</p>
                  <SkillCoursesPanel applicationId={app.applicationId} skill={skill} />
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </GlassCard>
  );
}

export function LearningRoadmap() {
  const [applications, setApplications] = useState<ApplicationRoadmap[]>([]);
  const [threshold, setThreshold] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getSkillGaps();
        if (!cancelled) {
          setApplications(data.applications);
          setThreshold(data.quizPassThreshold);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load your roadmap.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-[var(--color-text-muted)]">
        Improve your skills based on assessments you didn&apos;t pass (below {threshold}%).
      </p>

      {loading && (
        <p className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <LoaderCircle size={14} className="animate-spin" /> Building your roadmap…
        </p>
      )}
      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      {!loading && !error && applications.length === 0 && (
        <GlassCard>
          <p className="text-sm text-[var(--color-text-muted)]">
            You don&apos;t have any failed assessments yet. Apply to a job, complete its assessment,
            and if your score is below {threshold}% your roadmap will appear here.
          </p>
        </GlassCard>
      )}
      {applications.map((app) => (
        <RoadmapApplicationCard key={app.applicationId} app={app} />
      ))}
    </div>
  );
}
