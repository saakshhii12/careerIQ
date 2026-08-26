export interface AnalyticsWeeklyPoint {
  week: string;
  applications: number;
  hires: number;
}

export interface RecruiterAnalytics {
  avgTimeToHireDays: number;
  assessmentPassRate: number; // 0-100
  offerAcceptanceRate: number; // 0-100
  weeklyTrend: AnalyticsWeeklyPoint[];
  topSkillsInDemand: { skill: string; count: number }[];
}
