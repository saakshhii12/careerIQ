"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRecruiterSettings, useUpdateRecruiterSettings } from "@/lib/hooks/use-recruiter-settings";

export default function RecruiterSettingsPage() {
  const { data, isLoading } = useRecruiterSettings();
  const saveMutation = useUpdateRecruiterSettings();
  const [form, setForm] = useState({ fullName: "", phone: "", designation: "" });

  useEffect(() => {
    if (!data) return;
    setForm({
      fullName: data.fullName || "",
      phone: data.phone || "",
      designation: data.designation || "",
    });
  }, [data]);

  return (
    <>
      <Topbar title="Settings" subtitle="Your recruiter contact details" />
      <div className="flex flex-1 items-start justify-center p-8">
        <GlassCard className="w-full max-w-xl !p-8">
          {isLoading && <div className="h-48 animate-pulse rounded-md bg-[var(--color-bg-elevated)]" />}
          {!isLoading && (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(form);
              }}
            >
              <Input label="Email" value={data?.email || ""} disabled />
              <Input label="Company" value={data?.companyName || ""} disabled />
              <Input
                label="Your name"
                value={form.fullName}
                onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))}
              />
              <Input
                label="Designation"
                value={form.designation}
                onChange={(e) => setForm((current) => ({ ...current, designation: e.target.value }))}
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
              />
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving…" : "Save settings"}
              </Button>
              {saveMutation.isSuccess && (
                <p className="text-center text-xs text-[var(--color-success)]">Settings saved.</p>
              )}
            </form>
          )}
        </GlassCard>
      </div>
    </>
  );
}
