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
  assessmentType?: "quiz" | "interview";
  interviewFailed?: boolean;
  interviewScore?: number | null;
  interviewPassThreshold?: number;
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

export interface InterviewLearningRoadmap {
  applicationId: string;
  jobTitle: string;
  interviewScore: number;
  passThreshold: number;
  roadmap: {
    title: string;
    summary: string;
    steps: Array<{
      order: number;
      topic: string;
      rationale: string;
      actions: string[];
      practice: string;
    }>;
  };
}

export async function getSkillGaps(applicationId?: string): Promise<{
  quizPassThreshold: number;
  applications: ApplicationRoadmap[];
}> {
  const query = applicationId ? `?applicationId=${encodeURIComponent(applicationId)}` : "";
  return apiClient(`/candidate/skill-gaps${query}`);
}

export async function generateInterviewRoadmap(
  applicationId: string
): Promise<InterviewLearningRoadmap> {
  return apiClient(`/candidate/skill-gaps/${encodeURIComponent(applicationId)}/interview-roadmap`, {
    method: "POST",
  });
}

export async function getSkillCourses(
  skill: string,
  options: { applicationId: string; refresh?: boolean }
): Promise<{ courses: CourseRecommendation[]; cached: boolean; skill: string }> {
  const params = new URLSearchParams({ skill, applicationId: options.applicationId });
  if (options.refresh) params.set("refresh", "true");
  return apiClient(`/candidate/skill-courses?${params.toString()}`);
}
