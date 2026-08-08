export type ApplicationStage =
  | "applied"
  | "matched"
  | "assessment"
  | "interview"
  | "review"
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
  timeline: ApplicationStatusEvent[];
  /** Why the candidate passed/stalled/was rejected at the current stage. */
  decisionReason?: string;
}

export const STAGE_ORDER: ApplicationStage[] = [
  "applied",
  "matched",
  "assessment",
  "interview",
  "review",
];

export const STAGE_LABEL: Record<ApplicationStage, string> = {
  applied: "Applied",
  matched: "Matched",
  assessment: "Assessment",
  interview: "Interview",
  review: "Recruiter review",
  accepted: "Accepted",
  rejected: "Not selected",
  waitlisted: "Waitlisted",
};
