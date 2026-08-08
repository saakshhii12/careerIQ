"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoleTabs, type AuthRole } from "./role-tabs";

const schema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<AuthRole>("student");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit() {
    // Mock signup: swap for lib/api/auth.ts (register()) once backend exists.
    await new Promise((r) => setTimeout(r, 600));
    router.push(role === "student" ? "/student" : "/recruiter");
  }

  return (
    <>
      <RoleTabs value={role} onChange={setRole} />
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Full name"
          placeholder={role === "student" ? "Aditi Rao" : "Recruiter name"}
          error={errors.fullName?.message}
          {...register("fullName")}
        />
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
        <Input
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          Create {role} account
        </Button>
      </form>
    </>
  );
}
