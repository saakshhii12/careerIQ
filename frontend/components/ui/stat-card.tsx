import { LucideIcon } from "lucide-react";
import { GlassCard } from "./glass-card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <GlassCard className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
          <Icon size={18} strokeWidth={1.75} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="font-mono text-3xl font-semibold tracking-tight">{value}</span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium",
              trend.positive ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
            )}
          >
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
