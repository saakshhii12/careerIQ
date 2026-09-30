export interface RecruiterJob {
  id: string;
  title: string;
  department: string;
  location: string;
  workMode: "remote" | "hybrid" | "onsite";
  employmentType: "full_time" | "internship" | "contract";
  experienceLevel: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  responsibilities: string[];
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  deadline?: string | null;
  openings?: number;
  qualifiedCount?: number;
  interviewsCount?: number;
  shortlistedCount?: number;
  pipeline?: {
    applied: number;
    quizRequired: number;
    quizPassed: number;
    aiInterview: number;
    interviewCompleted: number;
    underReview: number;
    shortlisted: number;
    rejected: number;
  };
  /** Minimum resume/SBERT match % to proceed to assessment. */
  matchThreshold: number;
  /** Minimum assessment score % to proceed to interview. */
  assessmentPassThreshold: number;
  /** Minimum interview score % to proceed to recruiter review. */
  interviewPassThreshold: number;
  status: "open" | "paused" | "closed";
  applicantsCount: number;
  newApplicantsCount: number;
  postedAt: string;
}

export type RecruiterJobInput = Omit<RecruiterJob, "id" | "applicantsCount" | "newApplicantsCount" | "postedAt" | "status">;
