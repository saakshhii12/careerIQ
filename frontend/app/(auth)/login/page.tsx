import Link from "next/link";
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
      <LoginForm />
    </AuthShell>
  );
}
