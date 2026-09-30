import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Log in"
      subtitle="Access your CareerIQ dashboard."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[var(--color-accent)] hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-[var(--color-bg-elevated)]" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
