"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoleTabs } from "./role-tabs";
import { register as registerAccount } from "@/lib/api/auth";
import { useAuth } from "@/providers/auth-provider";
import { BACKEND_URL } from "@/lib/api/config";
import { homeForRole } from "@/lib/auth/home";

const schema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    collegeName: z.string().optional(),
    degree: z.string().optional(),
    phone: z.string().optional(),
    designation: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [role, setRole] = useState<"student" | "recruiter">("student");
  const [authError, setAuthError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<number | "">("");
  const [companies, setCompanies] = useState<{ companyId: number; companyName: string }[]>([]);
  const [companiesError, setCompaniesError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/auth/companies`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((body as { error?: string }).error ?? "Unable to load companies.");
        setCompanies((body as { companies?: { companyId: number; companyName: string }[] }).companies ?? []);
        setCompaniesError(null);
      })
      .catch((error) => {
        setCompanies([]);
        setCompaniesError(error instanceof Error ? error.message : "Unable to load companies.");
      });
  }, []);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setAuthError(null);
    try {
      if (role === "recruiter" && !companyId) {
        setAuthError("Select the company you recruit for.");
        return;
      }
      const user = await registerAccount({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role,
        collegeName: role === "student" ? values.collegeName : undefined,
        degree: role === "student" ? values.degree : undefined,
        phone: values.phone,
        designation: role === "recruiter" ? values.designation : undefined,
        companyId: role === "recruiter" && companyId ? Number(companyId) : undefined,
      });
      setUser(user);
      router.push(homeForRole(user.role));
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Unable to create account.");
    }
  }

  return (
    <>
      <RoleTabs value={role} onChange={(next) => { if (next !== "admin") setRole(next); }} />
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Full name"
          placeholder={role === "student" ? "Your full name" : "Recruiter name"}
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        {role === "student" && (
          <>
            <Input
              label="College"
              placeholder="e.g. IIT Bombay"
              error={errors.collegeName?.message}
              {...register("collegeName")}
            />
            <Input
              label="Degree"
              placeholder="e.g. B.Tech Computer Science"
              error={errors.degree?.message}
              {...register("degree")}
            />
          </>
        )}
        {role === "recruiter" && (
          <>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-[var(--color-text)]">Company</span>
              <select
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value ? Number(event.target.value) : "")}
                className="h-9 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
                required
              >
                <option value="">Select the company you recruit for</option>
                {companies.map((company) => (
                  <option key={company.companyId} value={company.companyId}>
                    {company.companyName}
                  </option>
                ))}
              </select>
              {companiesError && (
                <span className="text-xs text-[var(--color-danger)]">{companiesError}</span>
              )}
            </label>
            <Input
              label="Designation"
              placeholder="e.g. Talent Acquisition Lead"
              error={errors.designation?.message}
              {...register("designation")}
            />
          </>
        )}
        <Input
          label="Phone (optional)"
          placeholder="+91 98765 43210"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        {authError && (
          <p className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
            {authError}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          Create {role} account
        </Button>
      </form>
    </>
  );
}
