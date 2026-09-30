import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)]",
        accent: "bg-[var(--color-accent-soft)] text-[var(--color-accent-dim)] border border-[var(--color-accent)]/20",
        success: "bg-[var(--color-success-soft)] text-[var(--color-success)] border border-[var(--color-success)]/20",
        warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)] border border-[var(--color-warning)]/20",
        danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)] border border-[var(--color-danger)]/20",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/**
 * Labels for the pipeline stages derived from applications.status,
 * quiz_status/quiz_passed, and interview_sessions.status.
 */
export const STAGE_META: Record<string, { label: string; tone: BadgeProps["tone"] }> = {
  applied: { label: "Applied", tone: "neutral" },
  matched: { label: "Matched", tone: "neutral" },
  assessment: { label: "Quiz required", tone: "warning" },
  assessment_passed: { label: "Quiz passed", tone: "accent" },
  interview: { label: "Interview", tone: "accent" },
  review: { label: "Under review", tone: "accent" },
  shortlisted: { label: "Shortlisted", tone: "success" },
  accepted: { label: "Selected", tone: "success" },
  waitlisted: { label: "Waitlisted", tone: "warning" },
  rejected: { label: "Rejected", tone: "danger" },
};
