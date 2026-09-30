import Link from "next/link";
import { ReactNode } from "react";
import { GlassCard } from "@/components/ui/glass-card";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-[var(--color-bg)] px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-accent)] text-xs font-bold text-white">
            CQ
          </div>
          <span className="text-sm font-semibold text-[var(--color-text)]">CareerIQ</span>
        </Link>

        <GlassCard className="!p-6">
          <h1 className="text-lg font-semibold text-[var(--color-text)]">{title}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </GlassCard>

        <p className="mt-5 text-center text-sm text-[var(--color-text-muted)]">{footer}</p>
      </div>
    </div>
  );
}
