import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text-muted)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-11 rounded-[var(--radius-control)] bg-white/[0.04] border border-white/10 px-4 text-sm text-white placeholder:text-[var(--color-text-faint)]",
            "outline-none transition-all duration-150",
            "focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-soft)]",
            error && "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[0_0_0_3px_rgba(242,112,122,0.2)]",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
