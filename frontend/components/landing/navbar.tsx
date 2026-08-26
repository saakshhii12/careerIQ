"use client";

import Link from "next/link";
import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#students", label: "For students" },
  { href: "#recruiters", label: "For recruiters" },
];

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[var(--color-bg)]/70 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
            <Terminal size={16} strokeWidth={2} />
          </div>
          <span className="font-mono text-sm font-semibold tracking-wide text-white">
            careerIQ
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm">
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
