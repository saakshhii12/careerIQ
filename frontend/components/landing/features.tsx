"use client";

import { motion } from "framer-motion";
import { GraduationCap, Building2, Target, GitBranch, Users, BarChart3, MessageCircle, Route } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

const STUDENT_FEATURES = [
  { icon: Target, title: "CareerIQ score", body: "ATS score, SBERT match and company readiness combined into one number." },
  { icon: Route, title: "Skill gap roadmap", body: "A personalized learning path built from the gap between your resume and target roles." },
  { icon: MessageCircle, title: "AI career chatbot", body: "Grounded in your own resume, applications and history — not a generic assistant." },
];

const RECRUITER_FEATURES = [
  { icon: GitBranch, title: "AI-ranked pipeline", body: "Every candidate arrives pre-scored against your job description, with full evidence." },
  { icon: Users, title: "Full evaluation, one view", body: "Resume, assessment, interview report, GitHub and portfolio in a single candidate profile." },
  { icon: BarChart3, title: "Hiring analytics", body: "Track funnel conversion, time-to-hire and assessment pass rates across every role." },
];

function FeatureGroup({
  id,
  icon: Icon,
  eyebrow,
  title,
  items,
}: {
  id: string;
  icon: typeof GraduationCap;
  eyebrow: string;
  title: string;
  items: typeof STUDENT_FEATURES;
}) {
  return (
    <div id={id} className="flex-1">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
          <Icon size={19} strokeWidth={1.75} />
        </div>
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-faint)]">
            {eyebrow}
          </span>
          <h3 className="text-lg font-medium text-white">{title}</h3>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
          >
            <GlassCard interactive className="!p-5">
              <f.icon size={18} className="mb-3 text-[var(--color-accent)]" strokeWidth={1.75} />
              <h4 className="mb-1 text-sm font-medium text-white">{f.title}</h4>
              <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{f.body}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 max-w-xl">
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-accent)]">
            Platform
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Built for both sides of the hire
          </h2>
        </div>
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-8">
          <FeatureGroup
            id="students"
            icon={GraduationCap}
            eyebrow="For students"
            title="Know exactly where you stand"
            items={STUDENT_FEATURES}
          />
          <FeatureGroup
            id="recruiters"
            icon={Building2}
            eyebrow="For recruiters"
            title="Decide faster, with evidence"
            items={RECRUITER_FEATURES}
          />
        </div>
      </div>
    </section>
  );
}
