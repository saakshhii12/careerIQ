import { RecruiterDashboard } from "@/lib/types/recruiter";

export const MOCK_RECRUITER_DASHBOARD: RecruiterDashboard = {
  recruiterName: "Karan Mehta",
  companyName: "Nimbus Systems",
  stats: {
    activeJobs: 6,
    newApplications: 34,
    candidatesInInterview: 11,
    offersSent: 3,
  },
  hiringFunnel: [
    { stage: "applied", label: "Applied", count: 412 },
    { stage: "assessment", label: "Assessment", count: 198 },
    { stage: "interview", label: "Interview", count: 61 },
    { stage: "offer", label: "Offer", count: 14 },
    { stage: "hired", label: "Hired", count: 6 },
  ],
  activeJobsSummary: [
    { id: "j1", title: "Backend Engineer", department: "Engineering", applicants: 128, newApplicants: 12, status: "open", postedAt: "2026-08-01" },
    { id: "j2", title: "Frontend Engineer", department: "Engineering", applicants: 96, newApplicants: 8, status: "open", postedAt: "2026-07-28" },
    { id: "j3", title: "Product Analyst", department: "Product", applicants: 54, newApplicants: 3, status: "open", postedAt: "2026-07-24" },
    { id: "j4", title: "DevOps Engineer", department: "Infrastructure", applicants: 41, newApplicants: 6, status: "paused", postedAt: "2026-07-15" },
    { id: "j5", title: "QA Engineer", department: "Engineering", applicants: 33, newApplicants: 2, status: "open", postedAt: "2026-07-10" },
    { id: "j6", title: "Technical Writer", department: "Product", applicants: 18, newApplicants: 3, status: "closed", postedAt: "2026-06-30" },
  ],
  recentActivity: [
    { id: "a1", candidateName: "Aditi Rao", jobTitle: "Backend Engineer", event: "interview_completed", matchScore: 91, occurredAt: "2026-08-05T10:20:00Z" },
    { id: "a2", candidateName: "Rohan Iyer", jobTitle: "Frontend Engineer", event: "assessment_passed", matchScore: 87, occurredAt: "2026-08-05T08:05:00Z" },
    { id: "a3", candidateName: "Meera Nair", jobTitle: "Backend Engineer", event: "applied", matchScore: 78, occurredAt: "2026-08-04T17:40:00Z" },
    { id: "a4", candidateName: "Arjun Sharma", jobTitle: "DevOps Engineer", event: "offer_sent", matchScore: 94, occurredAt: "2026-08-04T13:15:00Z" },
    { id: "a5", candidateName: "Priya Desai", jobTitle: "Product Analyst", event: "waitlisted", matchScore: 65, occurredAt: "2026-08-03T15:50:00Z" },
    { id: "a6", candidateName: "Vikram Singh", jobTitle: "Backend Engineer", event: "applied", matchScore: 72, occurredAt: "2026-08-03T09:30:00Z" },
  ],
};
