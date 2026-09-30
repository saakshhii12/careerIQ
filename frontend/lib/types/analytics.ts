export interface AnalyticsWeeklyPoint {
  week: string;
  applications: number;
  hires: number;
}

export interface AnalyticsFunnelStage {
  stage: string;
  count: number;
}

export interface RecruiterAnalytics {
  totalApplications: number;
  avgTimeToHireDays: number | null;
  assessmentPassRate: number | null;
  offerAcceptanceRate: number | null;
  interviewCompletionRate: number | null;
  weeklyTrend: AnalyticsWeeklyPoint[];
  topSkillsInDemand: { skill: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  funnel: AnalyticsFunnelStage[];
  insufficientData?: boolean;
}
