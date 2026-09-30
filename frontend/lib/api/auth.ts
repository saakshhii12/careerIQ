import { BACKEND_URL } from "./config";
import { setToken, clearToken, setRole } from "@/lib/auth/token";

export interface AuthUser {
  user_id: number;
  full_name: string;
  email: string;
  role: "student" | "recruiter" | "admin";
  created_at: string;
  profile?: Record<string, unknown> | null;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

async function authFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return body as T;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await authFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  setRole(data.user.role);
  return data.user;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  role: "student" | "recruiter";
  collegeName?: string;
  degree?: string;
  specialization?: string;
  graduationYear?: number;
  phone?: string;
  city?: string;
  designation?: string;
  companyId?: number;
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  const data = await authFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  setToken(data.token);
  setRole(data.user.role);
  return data.user;
}

export async function getMe(token?: string): Promise<AuthUser> {
  const authToken = token ?? (typeof window !== "undefined" ? localStorage.getItem("careeriq_token") : null);
  const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error ?? "Session expired.");
  }
  return (body as { user: AuthUser }).user;
}

export function logout(): void {
  clearToken();
}
