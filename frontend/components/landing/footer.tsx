import Link from "next/link";
import { Terminal } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <Terminal size={14} />
          </div>
          <span className="text-sm text-[var(--color-text-muted)]">
            CareerIQ — campus hiring platform
          </span>
        </div>
        <div className="flex gap-6 text-sm text-[var(--color-text-faint)]">
          <Link href="/login" className="hover:text-[var(--color-text)]">Log in</Link>
          <Link href="/register" className="hover:text-[var(--color-text)]">Sign up</Link>
          <span>&copy; {new Date().getFullYear()} CareerIQ</span>
        </div>
      </div>
    </footer>
  );
}
