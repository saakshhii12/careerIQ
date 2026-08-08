export interface ChatMessage {
  id: string;
  sender: "student" | "recruiter" | "system";
  text: string;
  sentAt: string;
}

export interface Conversation {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  /** Chat only opens once the recruiter has accepted this candidate. */
  unlocked: boolean;
  messages: ChatMessage[];
  createdAt: string;
}
