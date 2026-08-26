export interface HiringFunnelStage {
  stage: "applied" | "assessment" | "interview" | "offer" | "hired";
  label: string;
  count: number;
}

export interface RecruiterActiveJob {
  id: string;
  title: string;
  department: string;
  applicants: number;
  newApplicants: number;
  status: "open" | "paused" | "closed";
  postedAt: string; // ISO date
}

export interface CandidateActivity {
  id: string;
  candidateName: string;
  jobTitle: string;
  event: "applied" | "assessment_passed" | "interview_completed" | "offer_sent" | "waitlisted";
  matchScore: number;
  occurredAt: string; // ISO date
}

export interface RecruiterDashboard {
  recruiterName: string;
  companyName: string;
  stats: {
    activeJobs: number;
    newApplications: number;
    candidatesInInterview: number;
    offersSent: number;
  };
  hiringFunnel: HiringFunnelStage[];
  activeJobsSummary: RecruiterActiveJob[];
  recentActivity: CandidateActivity[];
}

/** Full editable job posting, owned entirely by the recruiter side —
 * distinct from lib/types/job.ts, which is the student-facing browse view. */
export interface JobThresholds {
  matchThreshold: number; // % SBERT match required to proceed to assessment
  assessmentPassThreshold: number; // % required to proceed to interview
  interviewEnabled: boolean;
}

export interface RecruiterJobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  workMode: "remote" | "hybrid" | "onsite";
  employmentType: "full_time" | "internship" | "contract";
  experienceLevel: string;
  salaryMin?: number;
  salaryMax?: number;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  description: string;
  thresholds: JobThresholds;
  status: "open" | "paused" | "closed";
  applicantsCount: number;
  newApplicantsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type RecruiterJobFormInput = Omit<
  RecruiterJobPosting,
  "id" | "status" | "applicantsCount" | "newApplicantsCount" | "createdAt" | "updatedAt"
>;
