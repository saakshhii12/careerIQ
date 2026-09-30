export interface HiringFunnelStage {
  stage: string;
  label: string;
  count: number;
}

export interface RecruiterActiveJob {
  id: string;
  title: string;
  department: string;
  applicants: number;
  newApplicants: number;
  status: "open" | "paused" | "closed" | "archived";
  postedAt: string;
}

export interface CandidateActivity {
  id: string;
  candidateName: string;
  jobTitle: string;
  event: "applied" | "assessment_passed" | "interview_completed" | "offer_sent" | "waitlisted";
  matchScore: number;
  occurredAt: string;
}

export interface RecruiterRecentApplication {
  id: string;
  candidateName: string;
  jobTitle: string;
  matchScore: number;
  quizScore: number | null;
  interviewScore: number | null;
  status: string;
  appliedAt: string;
}

export interface RecruiterDashboard {
  recruiterName: string;
  companyName: string;
  stats: {
    activeJobs: number;
    totalApplicants: number;
    candidatesInQuiz: number;
    quizPassed: number;
    candidatesInInterview: number;
    interviewsCompleted: number;
    shortlisted: number;
    rejected: number;
    pendingReviews: number;
    newApplications: number;
    offersSent: number;
  };
  hiringFunnel: HiringFunnelStage[];
  activeJobsSummary: RecruiterActiveJob[];
  recentApplications: RecruiterRecentApplication[];
  recentActivity: CandidateActivity[];
}
