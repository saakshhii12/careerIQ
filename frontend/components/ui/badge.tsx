import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tracking-wide",
  {
    variants: {
      tone: {
        neutral: "bg-white/8 text-[var(--color-text-muted)] border border-white/10",
        accent: "bg-[var(--color-accent)]/12 text-[var(--color-accent)] border border-[var(--color-accent)]/25",
        success: "bg-[var(--color-success)]/12 text-[var(--color-success)] border border-[var(--color-success)]/25",
        warning: "bg-[var(--color-warning)]/12 text-[var(--color-warning)] border border-[var(--color-warning)]/25",
        danger: "bg-[var(--color-danger)]/12 text-[var(--color-danger)] border border-[var(--color-danger)]/25",
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

/** Maps an ApplicationSummary["stage"] to a badge tone + label, kept in one
 * place so the mapping stays consistent everywhere a stage is rendered. */
export const STAGE_META: Record<
  string,
  { label: string; tone: BadgeProps["tone"] }
> = {
  applied: { label: "Applied", tone: "neutral" },
  assessment: { label: "Assessment", tone: "accent" },
  interview: { label: "Interview", tone: "accent" },
  accepted: { label: "Accepted", tone: "success" },
  waitlisted: { label: "Waitlisted", tone: "warning" },
  rejected: { label: "Rejected", tone: "danger" },
};
