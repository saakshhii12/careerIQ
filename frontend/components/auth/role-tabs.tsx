"use client";

import { cn } from "@/lib/utils";

export type AuthRole = "student" | "recruiter";

export function RoleTabs({
  value,
  onChange,
}: {
  value: AuthRole;
  onChange: (role: AuthRole) => void;
}) {
  const options: { value: AuthRole; label: string }[] = [
    { value: "student", label: "Student" },
    { value: "recruiter", label: "Recruiter" },
  ];

  return (
    <div className="mb-6 flex rounded-full border border-white/10 bg-white/[0.03] p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 rounded-full py-2 text-sm font-medium transition-all duration-150",
            value === opt.value
              ? "bg-[var(--color-accent)] text-[#0b1424]"
              : "text-[var(--color-text-muted)] hover:text-white"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
