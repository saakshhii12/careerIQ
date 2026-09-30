export interface RecruiterMessage {
  id: string;
  sender: "student" | "recruiter" | "system";
  text: string;
  sentAt: string;
  read: boolean;
}

/**
 * One recruiter conversation, scoped to a single application.
 *
 * `unlocked` mirrors the backend rule: recruiter communication opens after a
 * passing AI interview (status Shortlisted) or a later Selected decision.
 */
export interface RecruiterThread {
  id: string;
  conversationId: string | null;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  recruiterName: string | null;
  applicationStatus: string;
  unlocked: boolean;
  lockedReason: string | null;
  /** What the candidate has to do next to progress toward being shortlisted. */
  nextStep: string | null;
  createdAt: string;
  messages: RecruiterMessage[];
}

/** Recruiter-side view of the same conversation. */
export interface RecruiterInboxThread {
  id: string;
  conversationId: string | null;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  candidateName: string;
  applicationStatus: string;
  unlocked: boolean;
  lastMessage?: string | null;
  lastUpdated?: string;
  unreadCount?: number;
  createdAt: string;
  messages: RecruiterMessage[];
}
