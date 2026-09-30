import type { AuthUser } from "@/lib/api/auth";

export function homeForRole(role: AuthUser["role"] | null | undefined): string {
  if (role === "admin") return "/admin";
  if (role === "recruiter") return "/recruiter/dashboard";
  return "/student";
}

export function isPathForRole(role: AuthUser["role"], path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (role === "admin") return path.startsWith("/admin");
  if (role === "recruiter") return path.startsWith("/recruiter");
  return path.startsWith("/student");
}
