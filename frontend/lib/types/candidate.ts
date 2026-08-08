import { ApplicationStage } from "@/lib/types/application";

export interface Candidate {
  id: string;
  name: string;
  jobId: string;
  jobTitle: string;
  stage: ApplicationStage;
  matchScore: number;
  assessmentScore?: number;
  interviewScore?: number;
  resumeFileName: string;
  appliedAt: string;
  strengths?: string[];
  weaknesses?: string[];
  interviewSummary?: string;
}
