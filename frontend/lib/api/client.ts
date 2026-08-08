import { API_BASE_URL } from "./config";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
}

/**
 * Thin fetch wrapper. Not used while USE_MOCK_API is true, but kept fully
 * wired so switching a repository from mock to live is a one-line change:
 *   return mockDelay(MOCK_STUDENT_DASHBOARD)
 * becomes
 *   return apiClient<StudentDashboard>("/students/me/dashboard")
 */
export async function apiClient<T>(
  path: string,
  { body, auth = true, headers, ...rest }: RequestOptions = {}
): Promise<T> {
  const token = auth && typeof window !== "undefined"
    ? window.localStorage.getItem("careeriq_access_token")
    : null;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(text || "Request failed", res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
