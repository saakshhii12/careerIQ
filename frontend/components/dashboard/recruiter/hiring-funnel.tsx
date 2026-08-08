"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { GlassCard } from "@/components/ui/glass-card";
import { HiringFunnelStage } from "@/lib/types/recruiter";

const STAGE_OPACITY = [1, 0.82, 0.64, 0.46, 0.3];

export function HiringFunnel({ data }: { data: HiringFunnelStage[] }) {
  return (
    <GlassCard className="flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-white">Hiring funnel</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Candidate volume at each stage, across all active jobs.
        </p>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" tick={{ fill: "var(--color-text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={90}
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
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
              {data.map((entry, i) => (
                <Cell key={entry.stage} fill="var(--color-accent)" fillOpacity={STAGE_OPACITY[i] ?? 0.3} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
