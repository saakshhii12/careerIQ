"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { GlassCard } from "@/components/ui/glass-card";
import { SkillGap } from "@/lib/types/student";

export function SkillGapChart({ data }: { data: SkillGap[] }) {
  return (
    <GlassCard className="flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-white">Skill gap analysis</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Your proficiency vs. what your target role requires.
        </p>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
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
              contentStyle={{
                background: "#20365d",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                fontSize: 12,
              }}
              labelStyle={{ color: "white" }}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-text-muted)" }} />
            <Bar dataKey="have" name="Your level" fill="var(--color-accent)" radius={[0, 6, 6, 0]} barSize={10} />
            <Bar dataKey="required" name="Required" fill="rgba(255,255,255,0.18)" radius={[0, 6, 6, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
