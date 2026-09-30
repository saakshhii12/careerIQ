"use client";

import { MapPin, Briefcase, Users, IndianRupee, Check } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Job } from "@/lib/types/job";

const WORK_MODE_LABEL: Record<Job["workMode"], string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

const EMPLOYMENT_LABEL: Record<Job["employmentType"], string> = {
  full_time: "Full-time",
  internship: "Internship",
  contract: "Contract",
};

function formatSalary(job: Job) {
  if (!job.salaryMin || !job.salaryMax) return null;
  const fmt = (n: number) => `${(n / 100000).toFixed(1)}L`;
  return `₹${fmt(job.salaryMin)} – ₹${fmt(job.salaryMax)} / yr`;
}

function matchTone(score?: number): "success" | "accent" | "warning" {
  if (!score) return "accent";
  if (score >= 80) return "success";
  if (score >= 60) return "accent";
  return "warning";
}

export function JobCard({
  job,
  onApply,
  applying,
}: {
  job: Job;
  onApply: (jobId: string) => void;
  applying?: boolean;
}) {
  const salary = formatSalary(job);

  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent)]">
            {job.company.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-medium text-[var(--color-text)]">{job.title}</h3>
            <p className="truncate text-sm text-[var(--color-text-muted)]">{job.company}</p>
          </div>
        </div>
        {job.matchScore !== undefined && (
          <Badge tone={matchTone(job.matchScore)} className="shrink-0">
            {job.matchScore}% match
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--color-text-faint)]">
        <span className="flex items-center gap-1.5">
          <MapPin size={13} /> {job.location} · {WORK_MODE_LABEL[job.workMode]}
        </span>
        <span className="flex items-center gap-1.5">
          <Briefcase size={13} /> {EMPLOYMENT_LABEL[job.employmentType]} · {job.experienceLevel}
        </span>
        {salary && (
          <span className="flex items-center gap-1.5">
            <IndianRupee size={13} /> {salary}
          </span>
        )}
      </div>

      <p className="text-sm leading-relaxed text-[var(--color-text-muted)] line-clamp-2">
        {job.description}
      </p>

      <div className="flex flex-wrap gap-2">
        {job.requiredSkills.map((skill) => (
          <Badge key={skill} tone="neutral">
            {skill}
          </Badge>
        ))}
      </div>

      <div className="mt-1 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-faint)]">
          <Users size={13} /> {job.applicantsCount} applicants
        </span>
        {job.applied ? (
          <Button size="sm" variant="secondary" disabled>
            <Check size={14} /> Applied
          </Button>
        ) : (
          <Button size="sm" onClick={() => onApply(job.id)} disabled={applying}>
            {applying ? "Applying…" : "Apply now"}
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
