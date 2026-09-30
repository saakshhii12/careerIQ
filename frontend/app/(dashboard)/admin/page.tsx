"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { assignRecruiter, createCompanyRecruiter, getAdminOverview, getAllotment } from "@/lib/api/admin";

export default function AdminAllotmentPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "allotment"],
    queryFn: getAllotment,
  });
  const { data: overview } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: getAdminOverview,
  });
  const [companyId, setCompanyId] = useState<number | "">("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const companies = data?.companies ?? [];
  const unassigned = data?.unassignedRecruiters ?? [];
  const allRecruiters = useMemo(
    () => [...unassigned, ...companies.flatMap((company) => company.recruiters)],
    [companies, unassigned]
  );

  const assignMutation = useMutation({
    mutationFn: ({ recruiterId, nextCompanyId }: { recruiterId: number; nextCompanyId: number }) =>
      assignRecruiter(recruiterId, nextCompanyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "allotment"] }),
  });

  const createMutation = useMutation({
    mutationFn: createCompanyRecruiter,
    onSuccess: () => {
      setFullName("");
      setEmail("");
      setPassword("");
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "allotment"] });
    },
    onError: (error: Error) => setFormError(error.message),
  });

  return (
    <>
      <Topbar
        title="Recruiter allotment"
        subtitle="Assign one or more recruiters to each company. Students who pass the interview chat with that company's recruiter."
      />

      <div className="flex flex-col gap-6 p-8">
        {overview && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {[
              ["Students", overview.users.students],
              ["Recruiters", overview.users.recruiters],
              ["Companies", overview.companies],
              ["Open jobs", overview.jobs.open_jobs],
              ["Applications", overview.applications.total_applications],
              ["Shortlisted", overview.applications.shortlisted],
              ["Rejected", overview.applications.rejected],
              ["Quiz passed", overview.applications.quiz_passed],
              ["Interviews", overview.interviews.total_interviews],
              ["Completed interviews", overview.interviews.completed_interviews],
              ["Quiz attempts", overview.quizAttempts],
              ["Users", overview.users.total_users],
            ].map(([label, value]) => (
              <GlassCard key={String(label)} className="!p-4">
                <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--color-text)]">{value}</p>
              </GlassCard>
            ))}
          </div>
        )}

        {isLoading && <div className="h-48 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-bg-elevated)]" />}
        {isError && <p className="text-sm text-[var(--color-danger)]">Couldn&apos;t load allotment data.</p>}

        <GlassCard className="flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Create a recruiter for a company</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              That recruiter can then sign in, see the company&apos;s jobs and candidates, and receive unlocked chat.
            </p>
          </div>
          <form
            className="grid grid-cols-1 gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!companyId) {
                setFormError("Choose a company.");
                return;
              }
              createMutation.mutate({
                fullName,
                email,
                password,
                companyId: Number(companyId),
              });
            }}
          >
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-[var(--color-text-muted)]">Company</span>
              <select
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value ? Number(event.target.value) : "")}
                className="h-10 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              >
                <option value="">Select company</option>
                {companies.map((company) => (
                  <option key={company.companyId} value={company.companyId}>
                    {company.companyName}
                    {company.recruiters.length ? "" : " — no recruiter yet"}
                  </option>
                ))}
              </select>
            </label>
            <Input label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <Input
              label="Temporary password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {formError && <p className="text-sm text-[var(--color-danger)] md:col-span-2">{formError}</p>}
            <div className="md:col-span-2">
              <Button type="submit" disabled={createMutation.isPending}>
                Allot recruiter
              </Button>
            </div>
          </form>
        </GlassCard>

        {unassigned.length > 0 && (
          <GlassCard>
            <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Unassigned recruiters</h2>
            <div className="flex flex-col gap-2">
              {unassigned.map((recruiter) => (
                <div key={recruiter.recruiterId} className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] py-2 last:border-0">
                  <div>
                    <p className="text-sm text-[var(--color-text)]">{recruiter.name}</p>
                    <p className="text-xs text-[var(--color-text-faint)]">{recruiter.email}</p>
                  </div>
                  <select
                    className="h-9 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm"
                    defaultValue=""
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      if (next) assignMutation.mutate({ recruiterId: recruiter.recruiterId, nextCompanyId: next });
                    }}
                  >
                    <option value="">Assign to company</option>
                    {companies.map((company) => (
                      <option key={company.companyId} value={company.companyId}>
                        {company.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        <div className="flex flex-col gap-3">
          {companies.map((company) => (
            <GlassCard key={company.companyId}>
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">{company.companyName}</h3>
                  <p className="text-xs text-[var(--color-text-faint)]">
                    {[company.industry, company.location].filter(Boolean).join(" · ") || "No company details"}
                  </p>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {company.recruiters.length ? `${company.recruiters.length} recruiter(s)` : "No recruiter allotted"}
                </p>
              </div>
              {company.recruiters.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Create a recruiter above, or assign an existing one. Until then, shortlisted students cannot message this company.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {company.recruiters.map((recruiter) => (
                    <li key={recruiter.recruiterId} className="text-sm text-[var(--color-text)]">
                      {recruiter.name}
                      <span className="text-[var(--color-text-faint)]"> · {recruiter.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          ))}
        </div>

        {allRecruiters.length === 0 && !isLoading && (
          <p className="text-sm text-[var(--color-text-muted)]">No recruiters in the system yet.</p>
        )}
      </div>
    </>
  );
}
