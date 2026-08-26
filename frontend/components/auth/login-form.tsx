"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoleTabs, type AuthRole } from "./role-tabs";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<AuthRole>("student");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit() {
    // Mock auth: no backend yet. Swap this for a real call to
    // lib/api/auth.ts (login()) once the FastAPI auth endpoints exist.
    await new Promise((r) => setTimeout(r, 600));
    router.push(role === "student" ? "/student" : "/recruiter");
  }

  return (
    <>
      <RoleTabs value={role} onChange={setRole} />
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
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
