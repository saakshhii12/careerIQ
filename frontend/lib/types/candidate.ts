import { ApplicationStage } from "@/lib/types/application";

export interface InterviewTranscriptItem {
  question: string;
  answer: string;
}

export interface CandidateExperience {
  company?: string;
  designation?: string;
  duration?: string;
}

export interface Candidate {
  id: string;
  studentId?: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  jobId: string;
  jobTitle: string;
  jobDescription?: string;
  stage: ApplicationStage;
  currentStage?: string;
  matchScore: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  matchExplanation?: string;
  skills?: string[];
  education?: string;
  collegeName?: string;
  degree?: string;
  experience?: CandidateExperience[];
  projects?: unknown[];
  assessmentScore?: number;
  quizStatus?: string;
  quizPassed?: boolean;
  interviewScore?: number;
  technicalScore?: number;
  communicationScore?: number;
  problemSolvingScore?: number;
  confidenceScore?: number;
  resumeFileName: string;
  resumeId?: string;
  hasResume?: boolean;
  resumeText?: string;
  resumeAnalysis?: {
    atsScore?: number;
    strengths?: string;
    weaknesses?: string;
    missingSkills?: string;
    recommendation?: string;
  };
  appliedAt: string;
  strengths?: string[];
  weaknesses?: string[];
  interviewSummary?: string;
  recommendation?: string;
  interviewDurationSeconds?: number;
  interviewCompletedAt?: string;
  interviewTranscript?: InterviewTranscriptItem[];
  interviewStatus?: string;
  chatUnlocked?: boolean;
  applicationStatus?: string;
  recruiterFeedback?: string;
  integrityViolationCount?: number;
  integrityEvents?: Array<{
    type: string;
    severity: string;
    at: string;
    details?: Record<string, unknown>;
  }>;
}
