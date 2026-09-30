"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, LogIn } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoleTabs, type AuthRole } from "./role-tabs";
import { login } from "@/lib/api/auth";
import { useAuth } from "@/providers/auth-provider";
import { homeForRole, isPathForRole } from "@/lib/auth/home";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { setUser } = useAuth();
  const [role, setRole] = useState<AuthRole>("student");
  const [authError, setAuthError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setAuthError(null);
    try {
      const user = await login(values.email, values.password);
      if (user.role !== role) {
        setAuthError(`This account is registered as a ${user.role}, not a ${role}.`);
        return;
      }
      setUser(user);
      await queryClient.resetQueries();
      const next = searchParams.get("next");
      router.push(next && isPathForRole(user.role, next) ? next : homeForRole(user.role));
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Unable to sign in.");
    }
  }

  return (
    <>
      <RoleTabs value={role} onChange={setRole} includeAdmin />
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        {authError && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {authError}
          </p>
        )}
        <div className="flex justify-end">
          <a href="#" className="text-xs text-[var(--color-accent)] hover:underline">
            Forgot password?
          </a>
        </div>
        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
          Log in as {role}
        </Button>
      </form>
    </>
  );
}
