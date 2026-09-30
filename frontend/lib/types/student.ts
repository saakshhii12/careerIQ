export interface CareerIQScoreBreakdown {
  atsScore: number; // 0-100
  sbertMatch: number; // 0-100
  companyReadiness: number; // 0-100
  overall: number; // 0-100
}

export interface SkillGap {
  skill: string;
  have: number; // 0-100 proficiency
  required: number; // 0-100 required by target roles
}

export type ApplicationStageKey =
  | "applied"
  | "assessment"
  | "assessment_passed"
  | "interview"
  | "review"
  | "shortlisted"
  | "accepted"
  | "rejected";

export interface ApplicationSummary {
  id: string;
  jobTitle: string;
  company: string;
  stage: ApplicationStageKey;
  /** The raw applications.status value from PostgreSQL. */
  status: string;
  matchScore: number | null;
  quizPassed: boolean;
  quizScore: number | null;
  interviewStatus: string | null;
  recruiterChatUnlocked: boolean;
  updatedAt: string; // ISO date
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  status: "done" | "in_progress" | "upcoming";
  etaWeeks: number;
}

export interface WeeklyActivityPoint {
  week: string; // "W1"
  applications: number;
  interviews: number;
}

export interface StudentDashboard {
  studentName: string;
  targetRole: string;
  profileComplete: boolean;
  hasResume: boolean;
  score: CareerIQScoreBreakdown;
  skillGaps: SkillGap[];
  applications: ApplicationSummary[];
  roadmap: RoadmapMilestone[];
  weeklyActivity: WeeklyActivityPoint[];
  notifications: {
    id: string;
    type: string;
    message: string;
    read: boolean;
    createdAt: string;
    href?: string | null;
  }[];
  unreadNotificationCount: number;
  /** Number of applications where a passing interview has shortlisted the candidate. */
  recruiterChatUnlockedCount: number;
  upcomingInterviews: {
    sessionId: number;
    jobTitle: string;
    company: string;
    status: string;
    overallScore?: number;
    interviewDate?: string | null;
  }[];
}
