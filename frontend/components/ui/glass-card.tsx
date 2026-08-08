import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  interactive?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glow, interactive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass rounded-[var(--radius-card)] p-6",
          glow && "glow-border",
          interactive &&
            "transition-all duration-200 hover:border-[var(--color-accent)]/40 hover:shadow-[0_0_28px_-8px_var(--color-accent-soft)] cursor-pointer",
          className
        )}
        {...props}
      />
    );
  }
);
GlassCard.displayName = "GlassCard";
