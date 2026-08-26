import { RecruiterAnalytics } from "@/lib/types/analytics";

export const MOCK_RECRUITER_ANALYTICS: RecruiterAnalytics = {
  avgTimeToHireDays: 12,
  assessmentPassRate: 48,
  offerAcceptanceRate: 82,
  weeklyTrend: [
    { week: "W1", applications: 58, hires: 0 },
    { week: "W2", applications: 74, hires: 1 },
    { week: "W3", applications: 66, hires: 0 },
    { week: "W4", applications: 91, hires: 2 },
    { week: "W5", applications: 83, hires: 1 },
    { week: "W6", applications: 102, hires: 2 },
  ],
  topSkillsInDemand: [
    { skill: "Java", count: 142 },
    { skill: "React", count: 118 },
    { skill: "SQL", count: 104 },
    { skill: "Spring Boot", count: 96 },
    { skill: "AWS", count: 71 },
  ],
};
