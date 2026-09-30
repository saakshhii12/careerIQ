import {
  StudentDashboard,
  ApplicationSummary,
  ApplicationStageKey,
  SkillGap,
  RoadmapMilestone,
  WeeklyActivityPoint,
} from "@/lib/types/student";
import { BACKEND_URL, getToken } from "./config";

interface BackendDashboardResponse {
  profile: {
    full_name: string;
    email: string;
    college_name?: string | null;
    degree?: string | null;
  };
  profileComplete: boolean;
  resume: {
    resume_name?: string;
    uploaded_at?: string;
    parsed_data?: Record<string, unknown> | string | null;
    has_extracted_text?: boolean;
  } | null;
  applications: Array<{
    application_id: number;
    job_id: number;
    job_title: string;
    company_name: string;
    match_score: number | string | null;
    match_details?: {
      matchedSkills?: string[];
      missingSkills?: string[];
      requiredSkills?: string[];
    } | string | null;
    quiz_passed: boolean | null;
    quiz_status: string | null;
    best_quiz_score: number | string | null;
    applied_at: string;
    status: string;
    interview_status: string | null;
    interview_score: number | string | null;
    recruiterChatUnlocked: boolean;
  }>;
  interviews: Array<{
    session_id: number;
    job_title: string;
    company_name: string;
    overall_score: number | null;
    status: string;
    interview_date: string | null;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    message: string;
    link: string | null;
    read: boolean;
    createdAt: string;
  }>;
  recruiterChatUnlockedCount: number;
}

type BackendApplication = BackendDashboardResponse["applications"][number];

function parseParsedData(raw: BackendDashboardResponse["resume"]) {
  if (!raw?.parsed_data) return null;
  if (typeof raw.parsed_data === "string") {
    try {
      return JSON.parse(raw.parsed_data) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return raw.parsed_data;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

/**
 * Derives the pipeline stage shown on the dashboard from the real database
 * columns. applications.status is authoritative for recruiter-driven states;
 * quiz_status / quiz_passed / interview_status cover the candidate-driven ones.
 *
 * No stage is hard-coded — every branch reads a stored value.
 */
function mapApplicationStage(row: BackendApplication): ApplicationStageKey {
  switch (row.status) {
    case "Selected":
      return "accepted";
    case "Rejected":
      return "rejected";
    case "Shortlisted":
      return "shortlisted";
    case "Interview Scheduled":
      return "interview";
    default:
      break;
  }
  if (row.quiz_passed) return "assessment_passed";
  if (row.quiz_status === "Completed") return "assessment";
  return "applied";
}

function mapApplication(row: BackendApplication): ApplicationSummary {
  return {
    id: String(row.application_id),
    jobTitle: row.job_title,
    company: row.company_name,
    stage: mapApplicationStage(row),
    status: row.status,
    matchScore: toNumber(row.match_score),
    quizPassed: Boolean(row.quiz_passed),
    quizScore: toNumber(row.best_quiz_score),
    interviewStatus: row.interview_status,
    recruiterChatUnlocked: Boolean(row.recruiterChatUnlocked),
    updatedAt: row.applied_at,
  };
}

function parseMatchDetails(raw: BackendApplication["match_details"]) {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as {
        matchedSkills?: string[];
        missingSkills?: string[];
        requiredSkills?: string[];
      };
    } catch {
      return null;
    }
  }
  return raw;
}

/**
 * Build skill coverage from real application match_details (matched vs missing).
 * Falls back to resume skill names without inventing proficiency percentages.
 */
function buildSkillGaps(
  parsed: Record<string, unknown> | null,
  applications: BackendApplication[]
): SkillGap[] {
  const missing = new Map<string, SkillGap>();
  const matched = new Map<string, SkillGap>();

  for (const app of applications) {
    const details = parseMatchDetails(app.match_details);
    if (!details) continue;
    for (const skill of details.matchedSkills ?? []) {
      matched.set(String(skill), { skill: String(skill), have: 100, required: 100 });
    }
    for (const skill of details.missingSkills ?? []) {
      if (matched.has(String(skill))) continue;
      missing.set(String(skill), { skill: String(skill), have: 0, required: 100 });
    }
  }

  const fromMatches = [...matched.values(), ...missing.values()];
  if (fromMatches.length > 0) return fromMatches.slice(0, 8);

  const skills = parsed?.skills;
  if (!Array.isArray(skills) || skills.length === 0) return [];
  return skills.slice(0, 6).map((skill) => ({
    skill: String(skill),
    have: 100,
    required: 100,
  }));
}

function buildRoadmap(data: BackendDashboardResponse): RoadmapMilestone[] {
  const hasResume = Boolean(data.resume?.has_extracted_text);
  const passedQuiz = data.applications.some((app) => app.quiz_passed);
  const completedInterview = data.interviews.some((item) => item.status === "Completed");
  const shortlisted = data.applications.some(
    (app) => app.status === "Shortlisted" || app.status === "Selected"
  );

  return [
    { id: "profile", title: "Complete your profile", status: data.profileComplete ? "done" : "in_progress", etaWeeks: 0 },
    { id: "resume", title: "Upload your resume", status: hasResume ? "done" : "in_progress", etaWeeks: 0 },
    {
      id: "apply",
      title: "Apply to a role",
      status: data.applications.length > 0 ? "done" : hasResume ? "in_progress" : "upcoming",
      etaWeeks: 0,
    },
    {
      id: "quiz",
      title: "Pass the screening assessment",
      status: passedQuiz ? "done" : data.applications.length > 0 ? "in_progress" : "upcoming",
      etaWeeks: 1,
    },
    {
      id: "interview",
      title: "Complete the interview",
      status: completedInterview ? "done" : passedQuiz ? "in_progress" : "upcoming",
      etaWeeks: 1,
    },
    {
      id: "shortlist",
      title: "Pass the AI interview to get shortlisted",
      status: shortlisted
        ? "done"
        : data.applications.some((app) => app.quiz_passed && app.status !== "Rejected")
          ? "in_progress"
          : "upcoming",
      etaWeeks: 2,
    },
  ];
}

function buildWeeklyActivity(data: BackendDashboardResponse): WeeklyActivityPoint[] {
  const buckets = new Map<string, { applications: number; interviews: number }>();
  for (const app of data.applications) {
    const month = new Date(app.applied_at).toISOString().slice(0, 7);
    const current = buckets.get(month) ?? { applications: 0, interviews: 0 };
    current.applications += 1;
    buckets.set(month, current);
  }
  for (const interview of data.interviews) {
    if (!interview.interview_date) continue;
    const month = new Date(interview.interview_date).toISOString().slice(0, 7);
    const current = buckets.get(month) ?? { applications: 0, interviews: 0 };
    current.interviews += 1;
    buckets.set(month, current);
  }

  const months = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  if (months.length === 0) return [{ week: "This month", applications: 0, interviews: 0 }];
  return months.map(([month, stats]) => ({
    week: new Date(`${month}-01`).toLocaleDateString("en-IN", { month: "short" }),
    applications: stats.applications,
    interviews: stats.interviews,
  }));
}

function mapDashboard(data: BackendDashboardResponse): StudentDashboard {
  const parsed = parseParsedData(data.resume);
  const applications = data.applications.map(mapApplication);
  const hasResume = Boolean(data.resume?.has_extracted_text);

  const matchScores = applications
    .map((app) => app.matchScore)
    .filter((score): score is number => score !== null && score > 0);
  const avgMatch =
    matchScores.length > 0
      ? Math.round(matchScores.reduce((sum, score) => sum + score, 0) / matchScores.length)
      : 0;

  const quizScores = applications
    .map((app) => app.quizScore)
    .filter((score): score is number => score !== null);
  const avgQuiz =
    quizScores.length > 0
      ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length)
      : 0;

  const interviewScores = data.interviews
    .map((item) => (item.overall_score != null ? Number(item.overall_score) : null))
    .filter((score): score is number => score !== null);
  const avgInterview =
    interviewScores.length > 0
      ? Math.round(interviewScores.reduce((sum, score) => sum + score, 0) / interviewScores.length)
      : 0;

  const notifications = data.notifications ?? [];

  return {
    studentName: data.profile.full_name,
    targetRole: typeof parsed?.targetRole === "string" ? parsed.targetRole : "",
    profileComplete: data.profileComplete,
    hasResume,
    // Every figure here is an average of values stored in PostgreSQL; a metric
    // with no underlying rows stays at 0 rather than showing an invented score.
    score: {
      atsScore: avgQuiz,
      sbertMatch: avgMatch,
      companyReadiness: avgInterview,
      overall: (() => {
        const parts = [avgMatch, avgQuiz, avgInterview].filter((value) => value > 0);
        return parts.length > 0
          ? Math.round(parts.reduce((sum, value) => sum + value, 0) / parts.length)
          : 0;
      })(),
    },
    skillGaps: buildSkillGaps(parsed, data.applications),
    applications,
    roadmap: buildRoadmap(data),
    weeklyActivity: buildWeeklyActivity(data),
    notifications,
    unreadNotificationCount: notifications.filter((item) => !item.read).length,
    recruiterChatUnlockedCount: data.recruiterChatUnlockedCount ?? 0,
    upcomingInterviews: data.interviews.map((item) => ({
      sessionId: item.session_id,
      jobTitle: item.job_title,
      company: item.company_name,
      status: item.status,
      overallScore: item.overall_score != null ? Math.round(Number(item.overall_score)) : undefined,
      interviewDate: item.interview_date,
    })),
  };
}

async function authedFetch<T>(path: string): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  } catch {
    throw new Error("Can't reach the CareerIQ server. Check that the backend is running.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status}).`);
  }
  return body as T;
}

export async function getStudentDashboard(): Promise<StudentDashboard> {
  const data = await authedFetch<BackendDashboardResponse>("/api/candidate/dashboard");
  return mapDashboard(data);
}
