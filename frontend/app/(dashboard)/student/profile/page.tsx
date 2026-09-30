"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Target } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhotoUpload } from "@/components/profile/photo-upload";
import { useProfile, useUpdateProfile, useUpdateProfilePhoto } from "@/lib/hooks/use-profile";
import { useResumeStatus } from "@/lib/hooks/use-resume";
import { useStudentDashboard } from "@/lib/hooks/use-student-dashboard";

export default function ProfilePage() {
  const { data: profile } = useProfile();
  const { data: resumeState } = useResumeStatus();
  const { data: dashboard } = useStudentDashboard();
  const updateProfile = useUpdateProfile();
  const photoMutation = useUpdateProfilePhoto();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [degree, setDegree] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName || "");
    setPhone(profile.phone || "");
    setCollegeName(profile.collegeName || "");
    setDegree(profile.degree || "");
    setCity(profile.city || "");
  }, [profile]);

  const onSave = async () => {
    setMessage(null);
    setError(null);
    try {
      await updateProfile.mutateAsync({
        fullName: fullName.trim(),
        phone: phone.trim(),
        collegeName: collegeName.trim() || undefined,
        degree: degree.trim() || undefined,
        city: city.trim() || undefined,
      });
      setMessage("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile.");
    }
  };

  const skillList =
    (profile?.skills && profile.skills.length > 0
      ? profile.skills
      : dashboard?.skillGaps?.map((gap) => gap.skill)) ?? [];

  return (
    <>
      <Topbar title="Profile" subtitle="Keep your details, resume, and skills up to date" />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
        <GlassCard className="!p-8">
          <div className="mb-6 flex justify-center">
            <PhotoUpload
              photoUrl={profile?.photoUrl}
              onUpload={(file) => {
                setError(null);
                photoMutation.mutate(file, {
                  onError: (err) =>
                    setError(err instanceof Error ? err.message : "Photo upload failed."),
                });
              }}
              isUploading={photoMutation.isPending}
            />
          </div>

          <div className="flex flex-col gap-4">
            <Input
              label="Full name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your name"
            />
            <Input label="Email" type="email" value={profile?.email || ""} disabled placeholder="you@example.com" />
            <Input
              label="Phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91 00000 00000"
            />
            <Input
              label="College"
              value={collegeName}
              onChange={(event) => setCollegeName(event.target.value)}
              placeholder="College / university"
            />
            <Input
              label="Degree"
              value={degree}
              onChange={(event) => setDegree(event.target.value)}
              placeholder="Degree"
            />
            <Input
              label="City"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="City"
            />
          </div>

          {message && <p className="mt-4 text-sm text-[var(--color-success)]">{message}</p>}
          {error && <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p>}

          <Button className="mt-6 w-full" onClick={onSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Saving…" : "Save changes"}
          </Button>
        </GlassCard>

        <GlassCard className="flex flex-col gap-4 !p-6">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[var(--color-accent)]" />
            <h3 className="text-sm font-medium text-[var(--color-text)]">Resume</h3>
          </div>
          {resumeState?.status === "complete" && resumeState.fileName ? (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--color-text)]">{resumeState.fileName}</p>
                {resumeState.uploadedAt && (
                  <p className="text-xs text-[var(--color-text-faint)]">
                    Uploaded {new Date(resumeState.uploadedAt).toLocaleDateString("en-IN")}
                  </p>
                )}
              </div>
              <Link href="/student/resume">
                <Button size="sm" variant="secondary">
                  Update
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-[var(--color-border)] px-4 py-6 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">No resume uploaded yet.</p>
              <Link href="/student/resume">
                <Button size="sm" className="mx-auto">
                  Upload resume
                </Button>
              </Link>
            </div>
          )}
        </GlassCard>

        <GlassCard className="flex flex-col gap-4 !p-6">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-[var(--color-accent)]" />
            <h3 className="text-sm font-medium text-[var(--color-text)]">Skills</h3>
          </div>
          {dashboard?.targetRole && (
            <p className="text-xs text-[var(--color-text-faint)]">Target role: {dashboard.targetRole}</p>
          )}
          {skillList.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skillList.map((skill) => (
                <Badge key={skill} tone="neutral">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              Upload your resume to extract skills, or apply to jobs to see skill matches.
            </p>
          )}
          {dashboard?.skillGaps && dashboard.skillGaps.some((gap) => gap.required > gap.have) && (
            <div className="mt-2 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                Missing vs recent applications
              </p>
              <div className="flex flex-wrap gap-2">
                {dashboard.skillGaps
                  .filter((gap) => gap.required > gap.have)
                  .map((gap) => (
                    <Badge key={gap.skill} tone="warning">
                      {gap.skill}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </>
  );
}
