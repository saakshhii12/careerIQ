import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-accent)] text-[#0b1424] hover:shadow-[0_0_28px_-4px_var(--color-accent)] hover:brightness-110",
        secondary:
          "glass text-white hover:border-[var(--color-accent)]/50 hover:shadow-[0_0_20px_-6px_var(--color-accent-soft)]",
        ghost:
          "text-[var(--color-text-muted)] hover:text-white hover:bg-white/5",
        outline:
          "border border-[var(--color-accent)]/40 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 hover:border-[var(--color-accent)]",
        danger:
          "bg-[var(--color-danger)]/15 text-[var(--color-danger)] border border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/25",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  }
);
Button.displayName = "Button";
