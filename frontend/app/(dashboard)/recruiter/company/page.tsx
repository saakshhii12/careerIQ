"use client";

import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhotoUpload } from "@/components/profile/photo-upload";
import { useCompanyProfile, useUpdateCompanyLogo } from "@/lib/hooks/use-company";

export default function CompanyProfilePage() {
  const { data: company } = useCompanyProfile();
  const logoMutation = useUpdateCompanyLogo();

  return (
    <>
      <Topbar title="Company Profile" subtitle="Shown to candidates on every job you post" />
      <div className="flex flex-1 items-start justify-center p-8">
        <GlassCard glow className="w-full max-w-xl !p-8">
          <div className="mb-8 flex justify-center">
            <PhotoUpload
              photoUrl={company?.logoUrl}
              onUpload={(file) => logoMutation.mutate(file)}
              isUploading={logoMutation.isPending}
            />
          </div>

          <div className="flex flex-col gap-4">
            <Input label="Company name" defaultValue={company?.name} placeholder="Your company" />
            <Input label="Website" defaultValue={company?.website} placeholder="https://" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Industry" defaultValue={company?.industry} placeholder="e.g. Fintech" />
              <Input label="Company size" defaultValue={company?.size} placeholder="e.g. 51-200 employees" />
            </div>
            <Input label="Location" defaultValue={company?.location} placeholder="City, Country" />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-text-muted)]">About</label>
              <textarea
                defaultValue={company?.description}
                rows={4}
                placeholder="What does your company do?"
                className="rounded-[var(--radius-control)] bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-[var(--color-text-faint)] outline-none transition-all duration-150 focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
              />
            </div>
          </div>

          <Button className="mt-6 w-full">Save changes</Button>
        </GlassCard>
      </div>
    </>
  );
}
