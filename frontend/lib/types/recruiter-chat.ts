import { ChatMessage } from "@/lib/types/chat";

export interface RecruiterConversation {
  id: string;
  candidateName: string;
  jobTitle: string;
  messages: ChatMessage[];
  createdAt: string;
}
