"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { homeForRole } from "@/lib/auth/home";
import type { AuthUser } from "@/lib/api/auth";

export function RoleGuard({
  allow,
  children,
}: {
  allow: AuthUser["role"][];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const allowed = allow.join(",");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!allow.includes(user.role)) {
      router.replace(homeForRole(user.role));
    }
  }, [allowed, loading, router, user]);

  if (loading || !user || !allow.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-[var(--color-bg)] text-sm text-[var(--color-text-muted)]">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
