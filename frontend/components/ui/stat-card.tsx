import { LucideIcon } from "lucide-react";
import { GlassCard } from "./glass-card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <GlassCard className={cn("flex flex-col gap-2 !p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
        {Icon && (
          <Icon size={16} strokeWidth={1.75} className="text-[var(--color-text-faint)]" />
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">{value}</span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium",
              trend.positive ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
