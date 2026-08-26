import { StudentApplication } from "@/lib/types/application";

export const MOCK_APPLICATIONS: StudentApplication[] = [
  {
    id: "app-j1",
    jobId: "j1",
    jobTitle: "Backend Engineer",
    company: "Nimbus Systems",
    currentStage: "accepted",
    matchScore: 91,
    assessmentScore: 88,
    decisionReason:
      "Strong technical interview performance and a resume match well above the role's threshold. The recruiter extended an offer.",
    timeline: [
      { stage: "applied", occurredAt: "2026-07-28T09:00:00Z" },
      { stage: "matched", occurredAt: "2026-07-28T09:02:00Z", note: "91% SBERT match" },
      { stage: "assessment", occurredAt: "2026-07-29T10:00:00Z", note: "Scored 88% — passed" },
      { stage: "interview", occurredAt: "2026-08-01T14:00:00Z", note: "AI interview completed" },
      { stage: "review", occurredAt: "2026-08-02T11:00:00Z" },
      { stage: "accepted", occurredAt: "2026-08-04T16:30:00Z" },
    ],
  },
  {
    id: "app-j2",
    jobId: "j2",
    jobTitle: "Java Developer",
    company: "Fintrail",
    currentStage: "interview",
    matchScore: 84,
    assessmentScore: 79,
    timeline: [
      { stage: "applied", occurredAt: "2026-08-01T09:00:00Z" },
      { stage: "matched", occurredAt: "2026-08-01T09:01:00Z", note: "84% SBERT match" },
      { stage: "assessment", occurredAt: "2026-08-02T10:00:00Z", note: "Scored 79% — passed" },
      { stage: "interview", occurredAt: "2026-08-05T09:00:00Z" },
    ],
  },
  {
    id: "app-j3",
    jobId: "j3",
    jobTitle: "Software Engineer I",
    company: "Orbitly",
    currentStage: "assessment",
    matchScore: 76,
    timeline: [
      { stage: "applied", occurredAt: "2026-07-30T09:00:00Z" },
      { stage: "matched", occurredAt: "2026-07-30T09:01:00Z", note: "76% SBERT match" },
      { stage: "assessment", occurredAt: "2026-08-03T10:00:00Z" },
    ],
  },
  {
    id: "app-j4",
    jobId: "j4",
    jobTitle: "SDE Intern",
    company: "Vantage Cloud",
    currentStage: "waitlisted",
    matchScore: 68,
    assessmentScore: 71,
    decisionReason:
      "Passed the assessment, but the interview score fell just under this role's bar. Kept on the waitlist in case a slot opens.",
    timeline: [
      { stage: "applied", occurredAt: "2026-07-25T09:00:00Z" },
      { stage: "matched", occurredAt: "2026-07-25T09:01:00Z", note: "68% SBERT match" },
      { stage: "assessment", occurredAt: "2026-07-26T10:00:00Z", note: "Scored 71% — passed" },
      { stage: "interview", occurredAt: "2026-07-27T14:00:00Z" },
      { stage: "review", occurredAt: "2026-07-28T11:00:00Z" },
      { stage: "waitlisted", occurredAt: "2026-07-28T17:00:00Z" },
    ],
  },
  {
    id: "app-j5",
    jobId: "j5",
    jobTitle: "Backend Engineer",
    company: "Ledgerly",
    currentStage: "rejected",
    matchScore: 54,
    decisionReason:
      "Resume match came in below Ledgerly's threshold of 65% for this role, so the application didn't advance to assessment.",
    timeline: [
      { stage: "applied", occurredAt: "2026-07-20T09:00:00Z" },
      { stage: "matched", occurredAt: "2026-07-20T09:01:00Z", note: "54% SBERT match" },
      { stage: "rejected", occurredAt: "2026-07-21T08:00:00Z" },
    ],
  },
];
