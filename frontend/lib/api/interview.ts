import { BACKEND_URL, getToken } from "./config";

export interface InterviewSessionQuestion {
  questionId: number;
  question: string;
  order: number;
}

export interface InterviewSessionResponse {
  sessionId: number;
  status: string;
  identityStatus: string;
  identityVerified: boolean;
  hasEnrolledIdentity: boolean;
  hasVerificationPhoto: boolean;
  questions: InterviewSessionQuestion[];
  resumeText: string;
  candidateInfo: Record<string, unknown> | null;
  job: { jobTitle: string; companyName: string; description: string };
  resumed: boolean;
}

export interface InterviewEvaluation {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  strengths?: string[];
  weaknesses?: string[];
  recommendation: string;
  feedback: string;
}

export interface InterviewCompleteResult {
  evaluation: InterviewEvaluation;
  passed: boolean;
  passThreshold: number;
  outcome: "Shortlisted" | "Rejected";
  chatUnlocked: boolean;
}

export interface IdentityCheckResult {
  passed: boolean;
  identityStatus: string;
  livenessPassed: boolean;
  matchScore: number | null;
  enrolled?: boolean;
  reasons?: string[];
  message: string;
}

async function authedFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  return body as T;
}

export async function createInterviewSession(
  applicationId: string
): Promise<InterviewSessionResponse> {
  const raw = await authedFetch<Record<string, unknown>>("/api/interviews/sessions", {
    method: "POST",
    body: JSON.stringify({ applicationId }),
  });
  return normalizeInterviewSession(raw);
}

function normalizeInterviewSession(raw: Record<string, unknown>): InterviewSessionResponse {
  const questionsRaw = (raw.questions as Array<Record<string, unknown>>) ?? [];
  const questions: InterviewSessionQuestion[] = questionsRaw.map((row, index) => ({
    questionId: Number(row.questionId ?? row.question_id),
    question: String(row.question ?? ""),
    order: Number(row.order ?? index + 1),
  }));

  const sessionId = Number(raw.sessionId ?? (raw.session as { session_id?: number })?.session_id);
  const jobRaw = (raw.job as Record<string, unknown>) ?? {};
  const sessionRow = raw.session as Record<string, unknown> | undefined;

  let candidateInfo = (raw.candidateInfo as Record<string, unknown> | null) ?? null;
  if (typeof candidateInfo === "string") {
    try {
      candidateInfo = JSON.parse(candidateInfo) as Record<string, unknown>;
    } catch {
      candidateInfo = null;
    }
  }

  const identityStatus = String(raw.identityStatus ?? "not_started");

  return {
    sessionId,
    status: String(raw.status ?? sessionRow?.status ?? "In Progress"),
    identityStatus,
    identityVerified: Boolean(raw.identityVerified) || identityStatus === "passed",
    hasEnrolledIdentity: Boolean(raw.hasEnrolledIdentity),
    hasVerificationPhoto: Boolean(raw.hasVerificationPhoto),
    questions,
    resumeText: String(raw.resumeText ?? ""),
    candidateInfo,
    job: {
      jobTitle: String(jobRaw.jobTitle ?? sessionRow?.job_title ?? ""),
      companyName: String(jobRaw.companyName ?? sessionRow?.company_name ?? ""),
      description: String(jobRaw.description ?? ""),
    },
    resumed: Boolean(raw.resumed ?? true),
  };
}

export async function fetchInterviewSession(sessionId: string): Promise<InterviewSessionResponse> {
  const raw = await authedFetch<Record<string, unknown>>(`/api/interviews/sessions/${sessionId}`);
  return normalizeInterviewSession(raw);
}

export async function submitIdentityCheck(
  sessionId: number,
  payload: {
    faceCount: number;
    liveDescriptor: number[];
    challengeDescriptor: number[] | null;
    claimLivenessPassed: boolean;
    enrollIfMissing?: boolean;
  }
): Promise<IdentityCheckResult> {
  const token = getToken();
  const res = await fetch(`${BACKEND_URL}/api/interviews/sessions/${sessionId}/identity-check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 403) {
    throw new Error((body as { error?: string }).error ?? `Identity check failed (${res.status})`);
  }
  return {
    passed: Boolean((body as IdentityCheckResult).passed),
    identityStatus: String((body as IdentityCheckResult).identityStatus ?? "failed"),
    livenessPassed: Boolean((body as IdentityCheckResult).livenessPassed),
    matchScore: (body as IdentityCheckResult).matchScore ?? null,
    enrolled: Boolean((body as IdentityCheckResult).enrolled),
    reasons: (body as IdentityCheckResult).reasons,
    message: String(
      (body as IdentityCheckResult).message ??
        (body as { error?: string }).error ??
        "Identity verification failed."
    ),
  };
}

export async function reportIdentityMonitor(
  sessionId: number,
  liveDescriptor: number[]
): Promise<{ matched: boolean; identityStatus: string; matchScore: number | null; reason?: string }> {
  const token = getToken();
  const res = await fetch(`${BACKEND_URL}/api/interviews/sessions/${sessionId}/identity-monitor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ liveDescriptor }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 409) {
    throw new Error((body as { error?: string }).error ?? `Identity monitor failed (${res.status})`);
  }
  return {
    matched: Boolean((body as { matched?: boolean }).matched),
    identityStatus: String((body as { identityStatus?: string }).identityStatus ?? "paused"),
    matchScore: (body as { matchScore?: number | null }).matchScore ?? null,
    reason: (body as { reason?: string }).reason,
  };
}

export async function reportIntegrityEvent(
  sessionId: number,
  eventType: string,
  severity: string,
  details: Record<string, unknown>
): Promise<void> {
  await authedFetch(`/api/interviews/sessions/${sessionId}/integrity-events`, {
    method: "POST",
    body: JSON.stringify({ eventType, severity, details }),
  });
}

export async function completeInterviewSession(
  sessionId: number,
  answers: { questionId: number; answer: string }[],
  metadata: {
    durationSeconds: number;
    integrityEvents: unknown[];
    questionTimings?: {
      questionId: number;
      startedAt: string;
      submittedAt: string;
      elapsedMs: number;
      timedOut: boolean;
      answerLength: number;
    }[];
  }
): Promise<InterviewCompleteResult> {
  const body = await authedFetch<InterviewCompleteResult>(
    `/api/interviews/sessions/${sessionId}/complete`,
    {
      method: "POST",
      body: JSON.stringify({ answers, metadata }),
    }
  );
  return {
    evaluation: body.evaluation,
    passed: Boolean(body.passed),
    passThreshold: Number(body.passThreshold ?? 60),
    outcome: body.outcome === "Shortlisted" ? "Shortlisted" : "Rejected",
    chatUnlocked: Boolean(body.chatUnlocked),
  };
}

export async function fetchVoiceSessionToken(): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/voice/session`, { method: "POST" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !(body as { token?: string }).token) {
    throw new Error((body as { error?: string }).error ?? "Unable to connect to voice service.");
  }
  return (body as { token: string }).token;
}
