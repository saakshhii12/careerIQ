"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCompanyProfile, useUpdateCompanyProfile } from "@/lib/hooks/use-company";

const TEXTAREA_CLASS =
  "rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] outline-none transition-colors focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]";

export default function CompanyProfilePage() {
  const { data: company, isLoading } = useCompanyProfile();
  const saveMutation = useUpdateCompanyProfile();
  const [form, setForm] = useState({
    name: "",
    website: "",
    industry: "",
    location: "",
    description: "",
    email: "",
    logoUrl: "",
  });

  useEffect(() => {
    if (!company) return;
    setForm({
      name: company.name || "",
      website: company.website || "",
      industry: company.industry || "",
      location: company.location || "",
      description: company.description || "",
      email: company.email || "",
      logoUrl: company.logoUrl || "",
    });
  }, [company]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <>
      <Topbar title="Company Profile" subtitle="Shown to candidates on every job you post" />
      <div className="flex flex-1 items-start justify-center p-8">
        <GlassCard className="w-full max-w-xl !p-8">
          {isLoading && <div className="h-64 animate-pulse rounded-md bg-[var(--color-bg-elevated)]" />}
          {!isLoading && (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(form);
              }}
            >
              {company?.recruiterName && (
                <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-4 py-3 text-sm">
                  <p className="font-medium text-[var(--color-text)]">{company.recruiterName}</p>
                  <p className="text-[var(--color-text-muted)]">
                    {[company.recruiterDesignation, company.recruiterEmail, company.recruiterPhone]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              )}
              <Input label="Company name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
              <Input label="Website" value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://" />
              <Input label="Company email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              <Input label="Logo URL" value={form.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Industry" value={form.industry} onChange={(e) => update("industry", e.target.value)} />
                <Input label="Location" value={form.location} onChange={(e) => update("location", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--color-text-muted)]">About</label>
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={4}
                  className={TEXTAREA_CLASS}
                />
              </div>
              <Button className="mt-2 w-full" type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
              {saveMutation.isSuccess && (
                <p className="text-center text-xs text-[var(--color-success)]">Company profile saved.</p>
              )}
              {saveMutation.isError && (
                <p className="text-center text-xs text-[var(--color-danger)]">
                  {saveMutation.error instanceof Error ? saveMutation.error.message : "Unable to save."}
                </p>
              )}
            </form>
          )}
        </GlassCard>
      </div>
    </>
  );
}
