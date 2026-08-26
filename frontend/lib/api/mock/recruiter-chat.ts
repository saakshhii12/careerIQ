import { RecruiterConversation } from "@/lib/types/recruiter-chat";

export const MOCK_RECRUITER_CONVERSATIONS: RecruiterConversation[] = [
  {
    id: "rconv-1",
    candidateName: "Aditi Rao",
    jobTitle: "Backend Engineer",
    createdAt: "2026-08-04T16:30:00Z",
    messages: [
      {
        id: "rm-1",
        sender: "system",
        text: "Aditi Rao was accepted for Backend Engineer. This chat is now open.",
        sentAt: "2026-08-04T16:30:00Z",
      },
      {
        id: "rm-2",
        sender: "recruiter",
        text: "Hi Aditi, congratulations! We'd love to set up a call to discuss the offer this week.",
        sentAt: "2026-08-04T17:10:00Z",
      },
      {
        id: "rm-3",
        sender: "student",
        text: "Thank you so much! I'm free Thursday afternoon, does that work?",
        sentAt: "2026-08-04T18:02:00Z",
      },
    ],
  },
];
