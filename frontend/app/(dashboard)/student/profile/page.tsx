"use client";

import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhotoUpload } from "@/components/profile/photo-upload";
import { useProfile, useUpdateProfilePhoto } from "@/lib/hooks/use-profile";

export default function ProfilePage() {
  const { data: profile } = useProfile();
  const photoMutation = useUpdateProfilePhoto();

  return (
    <>
      <Topbar title="Profile" subtitle="Keep your basic details up to date" />
      <div className="flex flex-1 items-start justify-center p-8">
        <GlassCard glow className="w-full max-w-lg !p-8">
          <div className="mb-8 flex justify-center">
            <PhotoUpload
              photoUrl={profile?.photoUrl}
              onUpload={(file) => photoMutation.mutate(file)}
              isUploading={photoMutation.isPending}
            />
          </div>

          <div className="flex flex-col gap-4">
            <Input label="Full name" defaultValue={profile?.fullName} placeholder="Your name" />
            <Input label="Email" type="email" defaultValue={profile?.email} placeholder="you@example.com" />
            <Input label="Phone" type="tel" defaultValue={profile?.phone} placeholder="+91 00000 00000" />
          </div>

          <Button className="mt-6 w-full">Save changes</Button>
        </GlassCard>
      </div>
    </>
  );
}
