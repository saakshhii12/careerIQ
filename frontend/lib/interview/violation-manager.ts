/**
 * Graduated integrity policy for the AI interview.
 *
 * Tab switches use a fixed 3-lifeline system:
 *   1st deliberate leave → warning (lifeline 1 of 3 used)
 *   2nd → warning (lifeline 2 of 3 used)
 *   3rd → interview terminated (no lifelines left)
 *
 * Permission/notification flickers never reach this manager.
 */

export type IntegrityLevel = "NORMAL" | "WARNING" | "PAUSED" | "TERMINATED";

export const VIOLATION_POLICY = {
  /** Soft warnings before a pause for presence issues (no-face / looking away). */
  warningsBeforePause: 2,
  /** Deliberate tab switches allowed before termination. */
  tabSwitchLifelines: 3,
};

const CAMERA_CRITICAL = new Set([
  "CAMERA_DISCONNECTED",
  "CAMERA_PERMISSION_DENIED",
  "CAMERA_UNAVAILABLE",
  "CAMERA_OBSTRUCTED",
  "CAMERA_QUALITY",
  "MULTIPLE_FACES",
  "PHONE_DETECTED",
  "IDENTITY_MISMATCH",
  "IDENTITY_FAILED",
]);

export function eventFamily(type: string): string {
  if (type === "TAB_SWITCH" || type === "WINDOW_BLUR" || type === "FOCUS_FLICKER") return "tab";
  if (type === "NO_FACE" || type === "LOOKING_AWAY") return "presence";
  if (CAMERA_CRITICAL.has(type)) return "camera";
  return type;
}

export interface ViolationDecision {
  level: IntegrityLevel;
  shouldPause: boolean;
  shouldWarn: boolean;
  shouldTerminate: boolean;
  warningCount: number;
  lifelinesUsed?: number;
  lifelinesTotal?: number;
  message: string;
}

export function createViolationManager(policy = VIOLATION_POLICY) {
  const familyCounts = new Map<string, number>();

  return {
    resetFamily(family: string) {
      familyCounts.delete(family);
    },
    resetAll() {
      familyCounts.clear();
    },
    getTabLifelinesUsed() {
      return familyCounts.get("tab") || 0;
    },
    handleConfirmed(type: string, reason: string): ViolationDecision {
      const family = eventFamily(type);
      const count = (familyCounts.get(family) || 0) + 1;
      familyCounts.set(family, count);

      if (family === "tab") {
        const total = policy.tabSwitchLifelines;
        if (count >= total) {
          return {
            level: "TERMINATED",
            shouldPause: false,
            shouldWarn: false,
            shouldTerminate: true,
            warningCount: count,
            lifelinesUsed: count,
            lifelinesTotal: total,
            message: `No lifelines remaining (${total} of ${total} used). The interview has ended because the interview tab was left repeatedly.`,
          };
        }
        return {
          level: "WARNING",
          shouldPause: true,
          shouldWarn: true,
          shouldTerminate: false,
          warningCount: count,
          lifelinesUsed: count,
          lifelinesTotal: total,
          message: `Tab switch detected. Lifeline used: ${count} of ${total}. Please remain on the interview screen.`,
        };
      }

      if (CAMERA_CRITICAL.has(type) && type !== "CAMERA_QUALITY") {
        return {
          level: "PAUSED",
          shouldPause: true,
          shouldWarn: false,
          shouldTerminate: false,
          warningCount: count,
          message: reason,
        };
      }

      if (count <= policy.warningsBeforePause) {
        return {
          level: "WARNING",
          shouldPause: false,
          shouldWarn: true,
          shouldTerminate: false,
          warningCount: count,
          message: reason || "Interview warning — please stay focused on the interview.",
        };
      }

      return {
        level: "PAUSED",
        shouldPause: true,
        shouldWarn: false,
        shouldTerminate: false,
        warningCount: count,
        message: reason || "Interview paused due to repeated integrity concerns.",
      };
    },
  };
}
