"use client";

import { motion } from "framer-motion";
import { ArrowRight, Briefcase } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-16 md:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex max-w-3xl flex-col items-center text-center"
      >
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
          <Briefcase size={13} />
          Campus hiring, end to end
        </div>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-[var(--color-text)] md:text-5xl">
          Prepare, apply, and track your career journey
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)]">
          CareerIQ connects students and recruiters through a structured hiring pipeline —
          resume review, skills assessments, and interviews with clear feedback at every stage.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register">
            <Button size="lg">
              Get started <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="secondary">
              See how it works
            </Button>
          </Link>
        </div>
        <div className="mt-8 flex items-center gap-5 text-sm text-[var(--color-text-faint)]">
          <span>Built for</span>
          <span className="text-[var(--color-text-muted)]">Students</span>
          <span className="h-1 w-1 rounded-full bg-[var(--color-border-strong)]" />
          <span className="text-[var(--color-text-muted)]">Recruiters</span>
          <span className="h-1 w-1 rounded-full bg-[var(--color-border-strong)]" />
          <span className="text-[var(--color-text-muted)]">Admins</span>
        </div>
      </motion.div>
    </section>
  );
}
