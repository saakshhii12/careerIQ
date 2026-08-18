"use client";

import { Radar } from "lucide-react";

const NAV_LINKS = ["Platform", "For Recruiters", "For Candidates", "Docs"];

export function SiteHeader() {
  return (
    <header className="relative z-10 border-b border-accent/[0.12] bg-white/[0.015]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-accent/35 bg-accent/[0.12] text-accent">
            <Radar size={18} />
          </div>
          <span className="text-[15px] font-semibold tracking-wide text-white">
            Career<span className="text-accent">IQ</span>
          </span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              className="text-[13px] text-muted transition hover:text-white"
            >
              {link}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="rounded-xl border border-accent/40 bg-accent/[0.1] px-4 py-2 text-[13px] font-medium text-accent transition hover:bg-accent/[0.18] hover:shadow-glow"
        >
          Sign in
        </button>
      </div>
    </header>
  );
}

export default SiteHeader;
