"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Input } from "@/components/ui/input";
import { JobCard } from "@/components/applications/job-card";
import { useJobs, useApplyToJob } from "@/lib/hooks/use-jobs";

export default function ApplicationsPage() {
  const { data: jobs, isLoading, isError, error } = useJobs();
  const applyMutation = useApplyToJob();
  const [search, setSearch] = useState("");
  const [confirmedJobTitle, setConfirmedJobTitle] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!jobs) return [];
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.requiredSkills.some((s) => s.toLowerCase().includes(q))
    );
  }, [jobs, search]);

  function handleApply(jobId: string) {
    const job = jobs?.find((j) => j.id === jobId);
    applyMutation.reset();
    applyMutation.mutate(jobId, {
      onSuccess: () => {
        // Recruiter chat does NOT open on application — it unlocks only when a
        // recruiter shortlists the candidate. See /student/messages.
        setConfirmedJobTitle(job?.title ?? "the role");
        setTimeout(() => setConfirmedJobTitle(null), 6000);
      },
    });
  }

  const applyError = applyMutation.error instanceof Error ? applyMutation.error.message : null;

  return (
    <>
      <Topbar title="Jobs" subtitle="Every open role from recruiters on CareerIQ" />

      <div className="flex flex-col gap-6 p-6">
        {confirmedJobTitle && (
          <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-success)]/25 bg-[var(--color-success-soft)] px-4 py-3 text-sm text-[var(--color-success)]">
            <CheckCircle2 size={16} />
            Application submitted for {confirmedJobTitle}.
            <Link href="/student/status" className="font-medium underline">
              Track it in Applications
            </Link>
          </div>
        )}

        {applyError && (
          <div className="flex flex-wrap items-start gap-2 rounded-[var(--radius-card)] border border-[var(--color-danger)]/25 bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{applyError}</span>
            {/resume/i.test(applyError) && (
              <Link href="/student/resume" className="font-medium underline">
                Upload resume
              </Link>
            )}
          </div>
        )}

        <div className="max-w-md">
          <Input
            placeholder="Search by title, company or skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-4"
          />
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-bg-elevated)]" />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-sm text-[var(--color-danger)]">
            {error instanceof Error ? error.message : "Couldn't load jobs."}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Search size={28} className="text-[var(--color-text-faint)]" />
            <p className="text-sm text-[var(--color-text-muted)]">No jobs match your search.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApply={handleApply}
              applying={applyMutation.isPending && applyMutation.variables === job.id}
            />
          ))}
        </div>
      </div>
    </>
  );
}
