"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RecruiterJobInput } from "@/lib/types/recruiter-job";

function ChipListInput({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[var(--color-text-muted)]">{label}</label>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" variant="secondary" size="md" onClick={add}>
          <Plus size={15} />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((v) => (
            <Badge key={v} tone="accent" className="gap-1.5">
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="hover:text-white"
              >
                <X size={11} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function ThresholdSlider({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[var(--color-text-muted)]">{label}</label>
        <span className="font-mono text-sm text-[var(--color-accent)]">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.08] accent-[var(--color-accent)]"
      />
      <span className="text-xs text-[var(--color-text-faint)]">{hint}</span>
    </div>
  );
}

export function JobForm({
  initial,
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  initial?: Partial<RecruiterJobInput>;
  onSubmit: (input: RecruiterJobInput) => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [department, setDepartment] = useState(initial?.department ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [workMode, setWorkMode] = useState<RecruiterJobInput["workMode"]>(initial?.workMode ?? "hybrid");
  const [employmentType, setEmploymentType] = useState<RecruiterJobInput["employmentType"]>(
    initial?.employmentType ?? "full_time"
  );
  const [experienceLevel, setExperienceLevel] = useState(initial?.experienceLevel ?? "");
  const [requiredSkills, setRequiredSkills] = useState<string[]>(initial?.requiredSkills ?? []);
  const [responsibilities, setResponsibilities] = useState<string[]>(initial?.responsibilities ?? []);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [matchThreshold, setMatchThreshold] = useState(initial?.matchThreshold ?? 60);
  const [assessmentPassThreshold, setAssessmentPassThreshold] = useState(initial?.assessmentPassThreshold ?? 65);
  const [interviewPassThreshold, setInterviewPassThreshold] = useState(initial?.interviewPassThreshold ?? 65);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      title,
      department,
      location,
      workMode,
      employmentType,
      experienceLevel,
      requiredSkills,
      responsibilities,
      description,
      matchThreshold,
      assessmentPassThreshold,
      interviewPassThreshold,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <GlassCard className="flex flex-col gap-4">
        <h3 className="text-sm font-medium text-white">Role details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Job title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Backend Engineer" required />
          <Input label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Engineering" required />
          <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bengaluru, India" required />
          <Input
            label="Experience level"
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            placeholder="0-2 years"
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-text-muted)]">Work mode</label>
            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value as RecruiterJobInput["workMode"])}
              className="h-11 rounded-[var(--radius-control)] bg-white/[0.04] border border-white/10 px-4 text-sm text-white outline-none focus:border-[var(--color-accent)]"
            >
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-text-muted)]">Employment type</label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as RecruiterJobInput["employmentType"])}
              className="h-11 rounded-[var(--radius-control)] bg-white/[0.04] border border-white/10 px-4 text-sm text-white outline-none focus:border-[var(--color-accent)]"
            >
              <option value="full_time">Full-time</option>
              <option value="internship">Internship</option>
              <option value="contract">Contract</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-text-muted)]">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="What will this person work on?"
            required
            className="rounded-[var(--radius-control)] bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-[var(--color-text-faint)] outline-none transition-all duration-150 focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
          />
        </div>
      </GlassCard>

      <GlassCard className="flex flex-col gap-5">
        <h3 className="text-sm font-medium text-white">Skills &amp; responsibilities</h3>
        <ChipListInput
          label="Required skills"
          placeholder="e.g. Java — press Enter to add"
          values={requiredSkills}
          onChange={setRequiredSkills}
        />
        <ChipListInput
          label="Responsibilities"
          placeholder="e.g. Own backend services — press Enter to add"
          values={responsibilities}
          onChange={setResponsibilities}
        />
      </GlassCard>

      <GlassCard className="flex flex-col gap-5">
        <div>
          <h3 className="text-sm font-medium text-white">Pipeline thresholds</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Candidates below these bars are automatically filtered before reaching you.
          </p>
        </div>
        <ThresholdSlider
          label="Resume match threshold"
          hint="Minimum SBERT match score to proceed to assessment"
          value={matchThreshold}
          onChange={setMatchThreshold}
        />
        <ThresholdSlider
          label="Assessment pass threshold"
          hint="Minimum assessment score to proceed to AI interview"
          value={assessmentPassThreshold}
          onChange={setAssessmentPassThreshold}
        />
        <ThresholdSlider
          label="Interview pass threshold"
          hint="Minimum interview score to reach recruiter review"
          value={interviewPassThreshold}
          onChange={setInterviewPassThreshold}
        />
      </GlassCard>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/recruiter/jobs")}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
