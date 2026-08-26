export type ApplicationStage =
  | "applied"
  | "assessment"
  | "interview"
  | "review"
  | "accepted"
  | "rejected"
  | "waitlisted";

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string; // initials fallback used if absent
  location: string;
  workMode: "remote" | "hybrid" | "onsite";
  employmentType: "full_time" | "internship" | "contract";
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  experienceLevel: string; // e.g. "0-1 years", "2-4 years"
  requiredSkills: string[];
  description: string;
  postedAt: string; // ISO date
  applicantsCount: number;
  matchScore?: number; // shown only for the logged-in student
  applied?: boolean;
  /** Only meaningful when `applied` is true — where this application sits
   * in the pipeline. Chat only unlocks once this reaches "accepted". */
  stage?: ApplicationStage;
}
