export type NotificationType =
  | "assessment_passed"
  | "assessment_ready"
  | "interview_scheduled"
  | "interview_completed"
  | "application_result"
  | "match_found"
  | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  /** Where clicking the notification should take the student. */
  href?: string;
}
