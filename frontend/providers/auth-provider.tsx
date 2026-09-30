"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getMe, logout as clearAuth, type AuthUser } from "@/lib/api/auth";
import { getToken, setRole } from "@/lib/auth/token";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

function persistUser(next: AuthUser | null): AuthUser | null {
  if (next) setRole(next.role);
  return next;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Resolves the signed-in user from the stored token. A rejected /me means the
 * token is expired or revoked, so the stale credential is discarded rather than
 * left behind to fail every subsequent request.
 */
async function loadSession(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) return null;
  try {
    return await getMe(token);
  } catch {
    clearAuth();
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback((next: AuthUser | null) => {
    setUser(persistUser(next));
  }, []);

  const refresh = useCallback(async () => {
    applyUser(await loadSession());
  }, [applyUser]);

  useEffect(() => {
    let active = true;
    loadSession().then((session) => {
      if (!active) return;
      applyUser(session);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [applyUser]);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, setUser: applyUser, logout, refresh }),
    [user, loading, applyUser, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
