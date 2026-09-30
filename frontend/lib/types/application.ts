/**
 * Mirrors the recruitment pipeline stored in PostgreSQL:
 * Apply → match → quiz (60%) → AI interview (60%) → shortlisted + chat.
 * Quiz or interview fail sets Rejected. Recruiter chat unlocks on Shortlisted.
 */
export type ApplicationStage =
  | "applied"
  | "matched"
  | "assessment"
  | "interview"
  | "review"
  | "shortlisted"
  | "accepted"
  | "rejected"
  | "waitlisted";

export interface ApplicationStatusEvent {
  stage: ApplicationStage;
  occurredAt: string;
  note?: string;
}

export interface StudentApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  currentStage: ApplicationStage;
  matchScore: number;
  assessmentScore?: number; // percent, once taken
  interviewScore?: number;
  interviewEligible?: boolean;
  quizPassed?: boolean;
  chatUnlocked?: boolean;
  applicationStatus?: string;
  timeline: ApplicationStatusEvent[];
  /** Why the candidate passed/stalled/was rejected at the current stage. */
  decisionReason?: string;
  /** Pipeline step where a rejected application stopped. */
  failedAt?: ApplicationStage;
}

export const STAGE_ORDER: ApplicationStage[] = [
  "applied",
  "assessment",
  "interview",
  "review",
  "shortlisted",
];

export const STAGE_LABEL: Record<ApplicationStage, string> = {
  applied: "Applied",
  matched: "Matched",
  assessment: "Assessment",
  interview: "Interview",
  review: "Under review",
  shortlisted: "Shortlisted",
  accepted: "Selected",
  rejected: "Not selected",
  waitlisted: "Waitlisted",
};
