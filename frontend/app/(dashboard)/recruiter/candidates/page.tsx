"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users, Search } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { STAGE_LABEL, stageTone } from "@/components/status/stage-meta";
import { ApplicationStage } from "@/lib/types/application";
import { useCandidates } from "@/lib/hooks/use-candidates";
import { useRecruiterJobs } from "@/lib/hooks/use-recruiter-jobs";
import { cn } from "@/lib/utils";

const FILTERS: (ApplicationStage | "all")[] = [
  "all",
  "applied",
  "assessment",
  "interview",
  "review",
  "shortlisted",
  "accepted",
  "rejected",
];

export default function CandidatesPage() {
  const { data: candidates, isLoading, isError } = useCandidates();
  const { data: jobs } = useRecruiterJobs();
  const [filter, setFilter] = useState<ApplicationStage | "all">("all");
  const [jobId, setJobId] = useState("all");
  const [search, setSearch] = useState("");
  const [quiz, setQuiz] = useState("all");
  const [minMatch, setMinMatch] = useState("");

  const filtered = useMemo(() => {
    return (candidates ?? []).filter((c) => {
      if (filter !== "all" && c.stage !== filter) return false;
      if (jobId !== "all" && c.jobId !== jobId) return false;
      if (quiz === "passed" && !c.quizPassed) return false;
      if (quiz === "failed" && !(c.quizStatus === "Completed" && !c.quizPassed)) return false;
      if (minMatch && c.matchScore < Number(minMatch)) return false;
      if (search.trim()) {
        const needle = search.toLowerCase();
        const haystack = [c.name, c.jobTitle, ...(c.skills ?? [])].join(" ").toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [candidates, filter, jobId, quiz, minMatch, search]);

  return (
    <>
      <Topbar title="Candidates" subtitle="Applicants to your company's jobs only" />

      <div className="flex flex-col gap-6 p-8">
        <div className="flex flex-col gap-3">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, skill, or job title"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
            >
              <option value="all">All jobs</option>
              {jobs?.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
            <select
              value={quiz}
              onChange={(e) => setQuiz(e.target.value)}
              className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
            >
              <option value="all">Quiz: any</option>
              <option value="passed">Quiz passed</option>
              <option value="failed">Quiz failed</option>
            </select>
            <select
              value={minMatch}
              onChange={(e) => setMinMatch(e.target.value)}
              className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
            >
              <option value="">Match: any</option>
              <option value="50">Match ≥ 50%</option>
              <option value="70">Match ≥ 70%</option>
              <option value="85">Match ≥ 85%</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-all duration-150",
                  filter === f
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                {f === "all" ? "All" : STAGE_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-bg-elevated)]" />
            ))}
          </div>
        )}

        {isError && <div className="text-sm text-[var(--color-danger)]">Couldn&apos;t load candidates.</div>}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Users size={28} className="text-[var(--color-text-faint)]" />
            <p className="text-sm text-[var(--color-text-muted)]">No candidates match these filters.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {filtered.map((c) => (
            <Link key={c.id} href={`/recruiter/candidates/${c.id}`}>
              <GlassCard interactive className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-xs font-semibold text-[var(--color-accent)]">
                    {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--color-text)]">{c.name}</p>
                    <p className="truncate text-xs text-[var(--color-text-faint)]">
                      {c.jobTitle}
                      {c.education ? ` · ${c.education}` : ""}
                    </p>
                    {c.skills && c.skills.length > 0 && (
                      <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">{c.skills.slice(0, 6).join(", ")}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-mono text-xs text-[var(--color-text-muted)]">{c.matchScore}% match</span>
                  <span className="font-mono text-xs text-[var(--color-text-muted)]">
                    Quiz {c.assessmentScore != null ? `${c.assessmentScore}%` : "—"}
                  </span>
                  {c.interviewScore !== undefined && (
                    <span className="font-mono text-xs text-[var(--color-accent)]">{c.interviewScore}% interview</span>
                  )}
                  <Badge tone={stageTone(c.stage)}>{c.currentStage || STAGE_LABEL[c.stage]}</Badge>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
