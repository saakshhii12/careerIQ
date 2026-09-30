import { apiClient } from "./client";

export interface RoadmapSkill {
  skill: string;
  demonstrated?: boolean;
  label?: string;
}

export interface ApplicationRoadmap {
  applicationId: string;
  jobId: number;
  jobTitle: string;
  companyName: string | null;
  quizStatus: string;
  quizPassed: boolean;
  quizScore: number | null;
  quizPassThreshold: number;
  assessmentFailed: boolean;
  noJobSkills: boolean;
  intro: string;
  skills: RoadmapSkill[];
  /** All required skills that receive course recommendations after a failed assessment. */
  learningSkills?: RoadmapSkill[];
  matchedSkills?: string[];
  missingSkills?: string[];
}

export interface CourseRecommendation {
  title: string;
  provider: string;
  url: string;
  description: string;
  level: string;
  freeStatus: "FREE" | "FREE_AUDIT" | "UNKNOWN";
  freeStatusLabel: string;
  relevanceReason: string;
}

export async function getSkillGaps(applicationId?: string): Promise<{
  quizPassThreshold: number;
  applications: ApplicationRoadmap[];
}> {
  const query = applicationId ? `?applicationId=${encodeURIComponent(applicationId)}` : "";
  return apiClient(`/candidate/skill-gaps${query}`);
}

export async function getSkillCourses(
  skill: string,
  options: { applicationId: string; refresh?: boolean }
): Promise<{ courses: CourseRecommendation[]; cached: boolean; skill: string }> {
  const params = new URLSearchParams({ skill, applicationId: options.applicationId });
  if (options.refresh) params.set("refresh", "true");
  return apiClient(`/candidate/skill-courses?${params.toString()}`);
}
