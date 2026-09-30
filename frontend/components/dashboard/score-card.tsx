"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { CareerIQScoreBreakdown } from "@/lib/types/student";

const RING_COLORS = ["var(--color-accent)", "#6366f1", "#818cf8"];

function Ring({
  value,
  radius,
  strokeWidth,
  color,
}: {
  value: number;
  radius: number;
  strokeWidth: number;
  color: string;
}) {
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <circle
      cx={110}
      cy={110}
      r={radius}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeDasharray={circumference}
      strokeDashoffset={offset}
      transform="rotate(-90 110 110)"
      style={{ transition: "stroke-dashoffset 0.8s ease" }}
    />
  );
}

export function ScoreCard({ score }: { score: CareerIQScoreBreakdown }) {
  const rings = [
    { label: "Overall", value: score.overall, radius: 92 },
    { label: "ATS score", value: score.atsScore, radius: 74 },
    { label: "SBERT match", value: score.sbertMatch, radius: 56 },
  ];

  return (
    <GlassCard className="flex flex-col items-center gap-6 md:flex-row md:items-start">
      <div className="relative shrink-0">
        <svg width={220} height={220} viewBox="0 0 220 220">
          <circle cx={110} cy={110} r={92} fill="none" stroke="var(--color-border)" strokeWidth={14} />
          <circle cx={110} cy={110} r={74} fill="none" stroke="var(--color-border)" strokeWidth={14} />
          <circle cx={110} cy={110} r={56} fill="none" stroke="var(--color-border)" strokeWidth={14} />
          {rings.map((r, i) => (
            <Ring key={r.label} value={r.value} radius={r.radius} strokeWidth={14} color={RING_COLORS[i]} />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-4xl font-semibold text-[var(--color-text)]">{score.overall}</span>
          <span className="text-xs text-[var(--color-text-muted)]">CareerIQ score</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h3 className="text-sm font-medium text-[var(--color-text)]">Score breakdown</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Composite of resume quality, semantic match and company readiness.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { label: "ATS score", value: score.atsScore, color: RING_COLORS[1] },
            { label: "SBERT match", value: score.sbertMatch, color: RING_COLORS[2] },
            { label: "Company readiness", value: score.companyReadiness, color: RING_COLORS[0] },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-xs text-[var(--color-text-muted)]">{row.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${row.value}%`, background: row.color }}
                />
              </div>
              <span className="w-9 shrink-0 text-right font-mono text-xs text-[var(--color-text)]">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
