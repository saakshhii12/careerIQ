import { ClipboardCheck, MessageSquare, Mail, Sparkles, Bell, LucideIcon } from "lucide-react";
import { NotificationType } from "@/lib/types/notification";

export const NOTIFICATION_META: Record<NotificationType, { icon: LucideIcon; tone: string }> = {
  assessment_passed: { icon: ClipboardCheck, tone: "text-[var(--color-accent)]" },
  assessment_ready: { icon: ClipboardCheck, tone: "text-[var(--color-text-muted)]" },
  interview_scheduled: { icon: MessageSquare, tone: "text-[var(--color-accent)]" },
  interview_completed: { icon: MessageSquare, tone: "text-[var(--color-accent)]" },
  application_result: { icon: Mail, tone: "text-[var(--color-success)]" },
  match_found: { icon: Sparkles, tone: "text-[var(--color-warning)]" },
  system: { icon: Bell, tone: "text-[var(--color-text-muted)]" },
};
