"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { GlassCard } from "@/components/ui/glass-card";
import { SkillGap } from "@/lib/types/student";

const TOOLTIP_STYLE = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--color-text)",
};

export function SkillGapChart({ data }: { data: SkillGap[] }) {
  return (
    <GlassCard className="flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-[var(--color-text)]">Skill gap analysis</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Matched vs missing skills from your real job applications.
        </p>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--color-text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="skill"
              width={100}
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: "var(--color-text)" }}
              cursor={{ fill: "var(--color-bg-muted)" }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-text-muted)" }} />
            <Bar dataKey="have" name="Your level" fill="var(--color-accent)" radius={[0, 4, 4, 0]} barSize={10} />
            <Bar dataKey="required" name="Required" fill="var(--color-border-strong)" radius={[0, 4, 4, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
