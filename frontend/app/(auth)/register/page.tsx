import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Join CareerIQ as a student or recruiter."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--color-accent)] hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
