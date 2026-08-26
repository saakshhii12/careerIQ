import Link from "next/link";
import { Terminal } from "lucide-react";
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
    <div className="flex min-h-screen flex-1 items-center justify-center bg-radial-glow px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
            <Terminal size={16} />
          </div>
          <span className="font-mono text-sm font-semibold text-white">careerIQ</span>
        </Link>

        <GlassCard glow className="!p-8">
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </GlassCard>

        <p className="mt-6 text-center text-sm text-[var(--color-text-faint)]">{footer}</p>
      </div>
    </div>
  );
}
