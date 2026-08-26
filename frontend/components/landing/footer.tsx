import Link from "next/link";
import { Terminal } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
            <Terminal size={14} />
          </div>
          <span className="font-mono text-sm text-[var(--color-text-muted)]">
            careerIQ — your AI career operating system
          </span>
        </div>
        <div className="flex gap-6 text-sm text-[var(--color-text-faint)]">
          <Link href="/login" className="hover:text-white">Log in</Link>
          <Link href="/register" className="hover:text-white">Sign up</Link>
          <span>&copy; {new Date().getFullYear()} CareerIQ</span>
        </div>
      </div>
    </footer>
  );
}
