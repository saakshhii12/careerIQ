"use client";

import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { RoadmapMilestone } from "@/lib/types/student";
import { cn } from "@/lib/utils";

const STATUS_ICON = {
  done: CheckCircle2,
  in_progress: CircleDot,
  upcoming: Circle,
};

export function RoadmapTimeline({ milestones }: { milestones: RoadmapMilestone[] }) {
  return (
    <GlassCard className="flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-white">Career roadmap</h3>
        <p className="text-sm text-[var(--color-text-muted)]">Your personalized path to target-role readiness.</p>
      </div>
      <div className="flex flex-col gap-1">
        {milestones.map((m, i) => {
          const Icon = STATUS_ICON[m.status];
          return (
            <div key={m.id} className="flex items-start gap-3 py-2.5">
              <div className="flex flex-col items-center">
                <Icon
                  size={18}
                  strokeWidth={1.75}
                  className={cn(
                    m.status === "done" && "text-[var(--color-success)]",
                    m.status === "in_progress" && "text-[var(--color-accent)]",
                    m.status === "upcoming" && "text-[var(--color-text-faint)]"
                  )}
                />
                {i < milestones.length - 1 && <div className="mt-1 h-full min-h-6 w-px bg-white/[0.08]" />}
              </div>
              <div className="pb-1">
                <p
                  className={cn(
                    "text-sm",
                    m.status === "upcoming" ? "text-[var(--color-text-muted)]" : "text-white"
                  )}
                >
                  {m.title}
                </p>
                <p className="text-xs text-[var(--color-text-faint)]">
                  {m.status === "done" ? "Completed" : m.status === "in_progress" ? "In progress" : `In ~${m.etaWeeks} weeks`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
