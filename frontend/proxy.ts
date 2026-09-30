import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_HOME: Record<string, string> = {
  student: "/student",
  recruiter: "/recruiter/dashboard",
  admin: "/admin",
};

function homeForRole(role: string | undefined): string {
  return ROLE_HOME[role ?? ""] ?? "/student";
}

function roleForPath(pathname: string): "student" | "recruiter" | "admin" | null {
  if (pathname.startsWith("/student")) return "student";
  if (pathname.startsWith("/recruiter")) return "recruiter";
  if (pathname.startsWith("/admin")) return "admin";
  return null;
}

/**
 * First-pass route guard. It only checks that a session cookie exists so that
 * unauthenticated users never see a dashboard shell; the backend still verifies
 * the JWT on every API call, which is where authorization actually happens.
 *
 * The role cookie is set at login so recruiters are never sent to the student
 * dashboard (and vice versa).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("careeriq_token")?.value;
  const role = request.cookies.get("careeriq_role")?.value;
  const area = roleForPath(pathname);
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (area && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL(homeForRole(role), request.url));
  }

  if (area && token && role && role !== area) {
    return NextResponse.redirect(new URL(homeForRole(role), request.url));
  }

  if (pathname === "/recruiter" || pathname === "/recruiter/") {
    return NextResponse.redirect(new URL("/recruiter/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/recruiter/:path*", "/admin/:path*", "/login", "/register"],
};
