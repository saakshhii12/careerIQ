"use client";

import { cn } from "@/lib/utils";

export type AuthRole = "student" | "recruiter" | "admin";

export function RoleTabs({
  value,
  onChange,
  includeAdmin = false,
}: {
  value: AuthRole;
  onChange: (role: AuthRole) => void;
  includeAdmin?: boolean;
}) {
  const options: { value: AuthRole; label: string }[] = [
    { value: "student", label: "Student" },
    { value: "recruiter", label: "Recruiter" },
  ];
  if (includeAdmin) options.push({ value: "admin", label: "Admin" });
  return (
    <div className="mb-6 flex rounded-full border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 rounded-full py-2 text-sm font-medium transition-all duration-150",
            value === opt.value
              ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
