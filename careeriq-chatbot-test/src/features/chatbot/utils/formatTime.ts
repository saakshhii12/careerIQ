/**
 * utils/formatTime.ts
 * Formats an ISO timestamp (or Date) into a short "h:mm AM/PM" label.
 */
export function formatTime(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default formatTime;
