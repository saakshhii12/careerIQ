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

export interface ApplicationSummary {
  id: string;
  jobTitle: string;
  company: string;
  stage: "applied" | "assessment" | "interview" | "accepted" | "rejected" | "waitlisted";
  matchScore: number;
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
  score: CareerIQScoreBreakdown;
  skillGaps: SkillGap[];
  applications: ApplicationSummary[];
  roadmap: RoadmapMilestone[];
  weeklyActivity: WeeklyActivityPoint[];
  notifications: { id: string; message: string; read: boolean; createdAt: string }[];
}
