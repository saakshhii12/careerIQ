"use client";

import { FileCheck, ClipboardCheck, MessageSquare, Mail, Clock3, LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { CandidateActivity } from "@/lib/types/recruiter";
import { cn } from "@/lib/utils";

const EVENT_META: Record<CandidateActivity["event"], { label: string; icon: LucideIcon; tone: string }> = {
  applied: { label: "applied to", icon: FileCheck, tone: "text-[var(--color-text-muted)]" },
  assessment_passed: { label: "passed assessment for", icon: ClipboardCheck, tone: "text-[var(--color-accent)]" },
  interview_completed: { label: "completed interview for", icon: MessageSquare, tone: "text-[var(--color-accent)]" },
  offer_sent: { label: "received an offer for", icon: Mail, tone: "text-[var(--color-success)]" },
  waitlisted: { label: "waitlisted for", icon: Clock3, tone: "text-[var(--color-warning)]" },
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function RecentActivity({ activity }: { activity: CandidateActivity[] }) {
  return (
    <GlassCard className="flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-white">Recent activity</h3>
        <p className="text-sm text-[var(--color-text-muted)]">Latest candidate movement across your pipeline.</p>
      </div>

      <div className="flex flex-col gap-1">
        {activity.map((a) => {
          const meta = EVENT_META[a.event];
          const Icon = meta.icon;
          return (
            <div key={a.id} className="flex items-start gap-3 py-2.5">
              <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]", meta.tone)}>
                <Icon size={15} strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white">
                  <span className="font-medium">{a.candidateName}</span>{" "}
                  <span className="text-[var(--color-text-muted)]">{meta.label}</span>{" "}
                  <span className="font-medium">{a.jobTitle}</span>
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-text-faint)]">
                  <span>{timeAgo(a.occurredAt)}</span>
                  <span>·</span>
                  <span className="font-mono text-[var(--color-accent)]">{a.matchScore}% match</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
