import { API_BASE_URL, getToken } from "./config";

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
 * Thin fetch wrapper around the Express backend.
 *
 * On failure it surfaces the backend's `{ error }` message so the UI can show
 * something actionable instead of a generic "Request failed". Network failures
 * become an ApiError with status 0 rather than an opaque TypeError.
 */
export async function apiClient<T>(
  path: string,
  { body, auth = true, headers, ...rest }: RequestOptions = {}
): Promise<T> {
  const token = auth ? getToken() : null;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Can't reach the CareerIQ server. Check that the backend is running.",
      0
    );
  }

  if (!res.ok) {
    throw new ApiError(await readErrorMessage(res), res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  if (text) {
    try {
      const parsed = JSON.parse(text) as { error?: string; message?: string };
      if (parsed.error) return parsed.error;
      if (parsed.message) return parsed.message;
    } catch {
      // Not JSON — fall through to the status-based message below.
    }
  }
  if (res.status === 401) return "Your session has expired. Sign in again.";
  if (res.status === 403) return "You do not have permission for this action.";
  if (res.status === 404) return "That resource could not be found.";
  return `Request failed (${res.status}).`;
}
