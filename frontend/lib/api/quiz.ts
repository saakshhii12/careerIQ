import { BACKEND_URL, getToken } from "./config";

export interface QuizQuestion {
  question_id: number;
  question_text: string;
  options: string[];
  question_order: number;
}

export interface QuizStartResponse {
  attemptId: number;
  questions: QuizQuestion[];
  resumed: boolean;
}

export interface QuizAnswer {
  questionId: number;
  selectedOptionIndex: number;
}

export interface QuizSubmitResponse {
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
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

export async function startQuiz(applicationId: string): Promise<QuizStartResponse> {
  return authedFetch<QuizStartResponse>("/api/quiz/start", {
    method: "POST",
    body: JSON.stringify({ applicationId }),
  });
}

export async function submitQuiz(
  attemptId: number,
  answers: QuizAnswer[]
): Promise<QuizSubmitResponse> {
  return authedFetch<QuizSubmitResponse>("/api/quiz/submit", {
    method: "POST",
    body: JSON.stringify({ attemptId, answers }),
  });
}

export async function getQuizStatus(applicationId: string) {
  return authedFetch<{
    quizStatus: string;
    quizPassed: boolean;
    bestQuizScore: number | null;
    passThreshold: number;
  }>(`/api/quiz/status/${applicationId}`);
}
