"use client";

import { motion } from "framer-motion";
import { ArrowRight, Cpu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-radial-glow px-6 pb-24 pt-20 md:pt-28">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex max-w-3xl flex-col items-center text-center"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/8 px-3 py-1.5 font-mono text-xs text-[var(--color-accent)]">
          <Cpu size={13} />
          AI assists. Recruiters decide.
        </div>
        <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-white md:text-5xl">
          Your AI career operating system
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-text-muted)]">
          CareerIQ connects students, recruiters and admins through a single
          intelligent pipeline — resume analysis, adaptive assessments and
          AI interviews that hand recruiters a clear, evidence-backed
          recommendation. The hire is always their call.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg">
              Start free <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="secondary">
              Explore features
            </Button>
          </Link>
        </div>
        <div className="mt-10 flex items-center gap-6 text-sm text-[var(--color-text-faint)]">
          <span>Built for</span>
          <span className="font-mono text-[var(--color-text-muted)]">Students</span>
          <span className="h-1 w-1 rounded-full bg-[var(--color-text-faint)]" />
          <span className="font-mono text-[var(--color-text-muted)]">Recruiters</span>
          <span className="h-1 w-1 rounded-full bg-[var(--color-text-faint)]" />
          <span className="font-mono text-[var(--color-text-muted)]">Admins</span>
        </div>
      </motion.div>
    </section>
  );
}
