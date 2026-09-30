/**
 * Mirrors notifications.type in PostgreSQL. Anything the backend adds later
 * that this list does not cover renders with the `system` icon.
 */
export type NotificationType =
  | "application_submitted"
  | "assessment_ready"
  | "assessment_passed"
  | "assessment_failed"
  | "interview_scheduled"
  | "interview_completed"
  | "application_result"
  | "recruiter_message"
  | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  /** The stored notification text. */
  message: string;
  read: boolean;
  createdAt: string;
  /** Where clicking the notification should take the user. */
  href?: string | null;
}
