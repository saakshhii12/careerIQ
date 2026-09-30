import { StudentApplication, ApplicationStage, ApplicationStatusEvent } from "@/lib/types/application";
import { BACKEND_URL, getToken } from "./config";

interface BackendApplicationRow {
  application_id: number;
  job_id: number;
  status: string;
  match_score: number | string | null;
  match_details: Record<string, unknown> | string | null;
  quiz_status: string | null;
  quiz_passed: boolean | null;
  best_quiz_score: number | string | null;
  applied_at: string;
  job_title: string;
  company_name: string;
  interview_status?: string | null;
  interview_score?: number | string | null;
  recruiter_chat_unlocked?: boolean;
}

interface BackendApplicationDetail {
  application: BackendApplicationRow;
  latestQuiz: {
    attempt_id: number;
    score: number | string | null;
    passed: boolean | null;
    status: string | null;
    completed_at: string | null;
  } | null;
  interview: {
    session_id: number;
    status: string | null;
    overall_score: number | string | null;
    interview_date: string | null;
  } | null;
  interviewEligible: boolean;
}

function num(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

/**
 * applications.status is authoritative for terminal outcomes. Quiz pass unlocks
 * the interview; interview score >= 60% shortlists and unlocks recruiter chat.
 */
function mapStage(
  row: BackendApplicationRow,
  interviewStatus?: string | null,
  interviewScore?: number | null
): ApplicationStage {
  switch ((row.status || "").toLowerCase()) {
    case "selected":
      return "accepted";
    case "rejected":
      return "rejected";
    case "shortlisted":
      return "shortlisted";
    case "under review":
      return "review";
    default:
      break;
  }

  const interview = (interviewStatus ?? row.interview_status ?? "").toLowerCase();
  if (interview === "completed" && (interviewScore == null || interviewScore < 60)) {
    return "rejected";
  }
  if (interview === "completed") return "review";
  if (interview === "in progress" || interview === "scheduled") return "interview";
  if (row.quiz_passed) return "interview";
  if (row.quiz_status === "Completed") return "assessment";
  return "applied";
}

function decisionReason(
  row: BackendApplicationRow,
  quizScore: number | null,
  interviewScore: number | null,
  interviewStatus: string | null
): { text?: string; failedAt?: ApplicationStage } {
  const interviewFailed =
    row.status === "Rejected" ||
    ((interviewStatus ?? "").toLowerCase() === "completed" &&
      (interviewScore == null || interviewScore < 60) &&
      row.status !== "Shortlisted" &&
      row.status !== "Selected");

  if (interviewFailed && !row.quiz_passed) {
    return {
      text: `Quiz scored ${quizScore ?? 0}%. You need at least 60% to continue. This application cannot proceed.`,
      failedAt: "assessment",
    };
  }
  if (interviewFailed) {
    return {
      text: `Interview scored ${interviewScore ?? 0}%. You need at least 60% to be shortlisted. This application cannot proceed.`,
      failedAt: "interview",
    };
  }
  if (row.status === "Under Review" || (interviewStatus === "Completed" && row.status !== "Rejected")) {
    return {
      text:
        interviewScore != null
          ? `Interview passed (${interviewScore}%). Your application is under recruiter review.`
          : "Your application is under recruiter review.",
    };
  }
  if (row.status === "Shortlisted" || row.status === "Selected") {
    return {
      text:
        interviewScore != null
          ? `You have been shortlisted (${interviewScore}% interview). Recruiter chat is unlocked.`
          : "You are shortlisted and recruiter chat is unlocked.",
    };
  }
  if (row.quiz_passed && interviewStatus !== "Completed") {
    return { text: "Quiz passed. Complete the AI interview next. You need 60% or higher to reach recruiter review." };
  }
  if (!row.quiz_passed) {
    return { text: "Take the screening quiz. You need at least 60% to unlock the AI interview." };
  }
  return {};
}

function mapApplication(
  row: BackendApplicationRow,
  detail?: Omit<BackendApplicationDetail, "application">
): StudentApplication {
  const quizScore = num(detail?.latestQuiz?.score ?? row.best_quiz_score);
  const interviewStatus = detail?.interview?.status ?? row.interview_status ?? null;
  const interviewScore = num(detail?.interview?.overall_score ?? row.interview_score);
  const matchScore = num(row.match_score);
  const reason = decisionReason(row, quizScore, interviewScore, interviewStatus);

  const timeline: ApplicationStatusEvent[] = [
    { stage: "applied", occurredAt: row.applied_at, note: "Application submitted" },
  ];
  if (matchScore != null) {
    timeline.push({
      stage: "matched",
      occurredAt: row.applied_at,
      note: `Profile match: ${matchScore}%`,
    });
  }
  if (row.quiz_status === "Completed" || quizScore != null) {
    timeline.push({
      stage: "assessment",
      occurredAt: detail?.latestQuiz?.completed_at ?? row.applied_at,
      note: row.quiz_passed
        ? `Quiz passed (${quizScore ?? 0}%) — 60% required`
        : `Quiz scored ${quizScore ?? 0}% — below 60%, cannot proceed`,
    });
  }
  if (interviewStatus) {
    const interviewNote =
      interviewStatus === "Completed"
        ? interviewScore != null
          ? interviewScore >= 60
            ? `Interview passed — score ${interviewScore}%`
            : `Interview failed — score ${interviewScore}% (60% required)`
          : "Interview completed"
        : `Interview ${interviewStatus.toLowerCase()}`;
    timeline.push({
      stage: "interview",
      occurredAt: detail?.interview?.interview_date ?? row.applied_at,
      note: interviewNote,
    });
  } else if (row.quiz_passed && row.status !== "Rejected") {
    timeline.push({
      stage: "interview",
      occurredAt: row.applied_at,
      note: "Eligible for the AI interview",
    });
  }
  if (row.status === "Under Review") {
    timeline.push({
      stage: "review",
      occurredAt: detail?.interview?.interview_date ?? row.applied_at,
      note: "Passed the AI interview — awaiting recruiter review",
    });
  }
  if (row.status === "Shortlisted" || row.status === "Selected") {
    timeline.push({
      stage: "shortlisted",
      occurredAt: detail?.interview?.interview_date ?? row.applied_at,
      note: "Shortlisted by the recruiter — recruiter chat unlocked",
    });
  }

  return {
    id: String(row.application_id),
    jobId: String(row.job_id),
    jobTitle: row.job_title,
    company: row.company_name,
    currentStage: mapStage(row, interviewStatus, interviewScore),
    matchScore: matchScore ?? 0,
    assessmentScore: quizScore ?? undefined,
    interviewScore: interviewScore ?? undefined,
    interviewEligible: Boolean(detail?.interviewEligible),
    quizPassed: Boolean(row.quiz_passed),
    chatUnlocked: Boolean(row.recruiter_chat_unlocked) || row.status === "Shortlisted" || row.status === "Selected",
    applicationStatus: row.status,
    timeline,
    decisionReason: reason.text,
    failedAt: reason.failedAt,
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

export async function getMyApplications(): Promise<StudentApplication[]> {
  const data = await authedFetch<{ applications: BackendApplicationRow[] }>("/api/applications/mine");
  return data.applications.map((row) => mapApplication(row));
}

export async function getApplicationById(id: string): Promise<StudentApplication | undefined> {
  const data = await authedFetch<BackendApplicationDetail>(`/api/applications/${id}`);
  if (!data.application) return undefined;
  return mapApplication(data.application, {
    latestQuiz: data.latestQuiz,
    interview: data.interview,
    interviewEligible: data.interviewEligible,
  });
}
