import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  ClipboardX,
  Mail,
  MessageSquare,
  Video,
  LucideIcon,
} from "lucide-react";
import { NotificationType } from "@/lib/types/notification";

export const NOTIFICATION_META: Record<NotificationType, { icon: LucideIcon; tone: string; label: string }> = {
  application_submitted: {
    icon: BriefcaseBusiness,
    tone: "text-[var(--color-accent)]",
    label: "Application submitted",
  },
  assessment_ready: {
    icon: ClipboardCheck,
    tone: "text-[var(--color-text-muted)]",
    label: "Assessment available",
  },
  assessment_passed: {
    icon: CheckCircle2,
    tone: "text-[var(--color-success)]",
    label: "Assessment passed",
  },
  assessment_failed: {
    icon: ClipboardX,
    tone: "text-[var(--color-warning)]",
    label: "Assessment not passed",
  },
  interview_scheduled: {
    icon: Video,
    tone: "text-[var(--color-accent)]",
    label: "Interview",
  },
  interview_completed: {
    icon: Video,
    tone: "text-[var(--color-accent)]",
    label: "Interview completed",
  },
  application_result: {
    icon: Mail,
    tone: "text-[var(--color-success)]",
    label: "Application update",
  },
  recruiter_message: {
    icon: MessageSquare,
    tone: "text-[var(--color-accent)]",
    label: "Recruiter message",
  },
  system: { icon: Bell, tone: "text-[var(--color-text-muted)]", label: "Update" },
};

export function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
