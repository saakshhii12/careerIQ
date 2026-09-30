"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { GlassCard } from "@/components/ui/glass-card";
import { WeeklyActivityPoint } from "@/lib/types/student";

const TOOLTIP_STYLE = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--color-text)",
};

export function ActivityChart({ data }: { data: WeeklyActivityPoint[] }) {
  return (
    <GlassCard className="flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-[var(--color-text)]">Activity, last 6 weeks</h3>
        <p className="text-sm text-[var(--color-text-muted)]">Applications sent vs. interviews reached.</p>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -16, right: 8 }}>
            <defs>
              <linearGradient id="appGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="intGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-text-faint)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--color-text-faint)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: "var(--color-text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--color-text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "var(--color-text)" }} />
            <Area type="monotone" dataKey="applications" stroke="var(--color-accent)" fill="url(#appGradient)" strokeWidth={2} />
            <Area type="monotone" dataKey="interviews" stroke="var(--color-text-muted)" fill="url(#intGradient)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
