import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  interactive?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glow: _glow, interactive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "surface-card rounded-[var(--radius-card)] p-5",
          interactive &&
            "cursor-pointer transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-muted)]",
          className
        )}
        {...props}
      />
    );
  }
);
GlassCard.displayName = "GlassCard";
