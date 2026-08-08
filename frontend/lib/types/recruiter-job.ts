export interface RecruiterJob {
  id: string;
  title: string;
  department: string;
  location: string;
  workMode: "remote" | "hybrid" | "onsite";
  employmentType: "full_time" | "internship" | "contract";
  experienceLevel: string;
  requiredSkills: string[];
  responsibilities: string[];
  description: string;
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
