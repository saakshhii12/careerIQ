import { StudentDashboard } from "@/lib/types/student";

export const MOCK_STUDENT_DASHBOARD: StudentDashboard = {
  studentName: "Aditi Rao",
  targetRole: "Backend Engineer (Java / Spring)",
  score: {
    atsScore: 78,
    sbertMatch: 84,
    companyReadiness: 71,
    overall: 79,
  },
  skillGaps: [
    { skill: "Spring Boot", have: 70, required: 90 },
    { skill: "SQL", have: 82, required: 85 },
    { skill: "System Design", have: 40, required: 75 },
    { skill: "REST APIs", have: 88, required: 90 },
    { skill: "Docker", have: 35, required: 60 },
  ],
  applications: [
    { id: "a1", jobTitle: "Backend Engineer", company: "Nimbus Systems", stage: "interview", matchScore: 91, updatedAt: "2026-08-03" },
    { id: "a2", jobTitle: "Java Developer", company: "Fintrail", stage: "assessment", matchScore: 84, updatedAt: "2026-08-02" },
    { id: "a3", jobTitle: "Software Engineer I", company: "Orbitly", stage: "applied", matchScore: 76, updatedAt: "2026-07-30" },
    { id: "a4", jobTitle: "SDE Intern", company: "Vantage Cloud", stage: "waitlisted", matchScore: 68, updatedAt: "2026-07-27" },
    { id: "a5", jobTitle: "Backend Engineer", company: "Ledgerly", stage: "rejected", matchScore: 54, updatedAt: "2026-07-21" },
  ],
  roadmap: [
    { id: "r1", title: "Core Java + DSA refresh", status: "done", etaWeeks: 0 },
    { id: "r2", title: "Spring Boot deep dive", status: "in_progress", etaWeeks: 2 },
    { id: "r3", title: "System design fundamentals", status: "upcoming", etaWeeks: 4 },
    { id: "r4", title: "Mock interview sprint", status: "upcoming", etaWeeks: 6 },
  ],
  weeklyActivity: [
    { week: "W1", applications: 2, interviews: 0 },
    { week: "W2", applications: 4, interviews: 1 },
    { week: "W3", applications: 3, interviews: 1 },
    { week: "W4", applications: 5, interviews: 2 },
    { week: "W5", applications: 4, interviews: 3 },
    { week: "W6", applications: 6, interviews: 3 },
  ],
  notifications: [
    { id: "n1", message: "Interview scheduled with Nimbus Systems", read: false, createdAt: "2026-08-04T09:00:00Z" },
    { id: "n2", message: "Assessment result ready for Fintrail", read: false, createdAt: "2026-08-03T14:00:00Z" },
    { id: "n3", message: "New roadmap milestone unlocked", read: true, createdAt: "2026-08-01T10:00:00Z" },
  ],
};
