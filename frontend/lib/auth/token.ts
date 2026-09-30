const TOKEN_KEY = "careeriq_token";
const ROLE_KEY = "careeriq_role";
const COOKIE_MAX_AGE_SEC = 7 * 24 * 60 * 60;

export type AuthRoleCookie = "student" | "recruiter" | "admin";

function writeCookie(name: string, value: string, maxAge = COOKIE_MAX_AGE_SEC): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/** Persist JWT for API calls (localStorage) and route protection (cookie). */
export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  writeCookie(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setRole(role: AuthRoleCookie): void {
  if (typeof window === "undefined") return;
  writeCookie(ROLE_KEY, role);
}

export function getRole(): AuthRoleCookie | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )careeriq_role=([^;]*)/);
  const value = match ? decodeURIComponent(match[1]) : null;
  if (value === "student" || value === "recruiter" || value === "admin") return value;
  return null;
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  writeCookie(TOKEN_KEY, "", 0);
  writeCookie(ROLE_KEY, "", 0);
}
