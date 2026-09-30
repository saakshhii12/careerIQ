/** Allowed values for interview_integrity_events.severity (PostgreSQL check). */
export const INTEGRITY_SEVERITIES = ["info", "warning", "critical"];

const ALIASES = {
  info: "info",
  low: "info",
  medium: "warning",
  warn: "warning",
  warning: "warning",
  high: "critical",
  critical: "critical",
};

/**
 * Maps client/API severity labels to DB-safe values.
 * Legacy UI used low/medium/high; schema uses info/warning/critical.
 */
export function normalizeIntegritySeverity(severity, fallback = "warning") {
  const key = String(severity ?? fallback)
    .trim()
    .toLowerCase();
  return ALIASES[key] || fallback;
}
