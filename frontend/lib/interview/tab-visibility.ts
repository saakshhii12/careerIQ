/**
 * Tab/window integrity for AI interviews.
 *
 * Ignores: permission dialogs (blur without hide), short OS notification flickers,
 * and a brief startup/permission grace window.
 *
 * Counts: deliberate tab/window switches (document becomes hidden and stays hidden
 * long enough that it is not a flicker). Each confirmed switch spends one lifeline.
 */

export const TAB_VISIBILITY_CONFIG = {
  /** Short quiet window while camera/mic permission prompts settle. */
  startupGraceMs: 3_500,
  /** Suppress after explicit camera/mic permission activity. */
  permissionSuppressMs: 5_000,
  /**
   * Hidden duration required to count as a deliberate tab switch.
   * Short enough to catch real switches; long enough to ignore notification flashes.
   */
  sustainedHiddenMs: 450,
  /** Ignore duplicate confirms from the same leave. */
  confirmDebounceMs: 1_200,
};

export type TabVisibilityEvent =
  | { level: "transient"; type: "FOCUS_FLICKER"; reason: string }
  | { level: "confirmed"; type: "TAB_SWITCH"; reason: string; hiddenMs: number };

type Listener = (event: TabVisibilityEvent) => void;

export function createTabVisibilityDetector(
  onEvent: Listener,
  config = TAB_VISIBILITY_CONFIG
) {
  let graceUntil = Date.now() + config.startupGraceMs;
  let permissionUntil = 0;
  let hiddenSince: number | null = null;
  let confirmTimer: ReturnType<typeof setTimeout> | null = null;
  let lastConfirmAt = 0;
  let disposed = false;

  const suppressed = () => Date.now() < graceUntil || Date.now() < permissionUntil;

  const clearConfirmTimer = () => {
    if (confirmTimer) {
      clearTimeout(confirmTimer);
      confirmTimer = null;
    }
  };

  const emitConfirmed = (hiddenMs: number) => {
    if (Date.now() - lastConfirmAt < config.confirmDebounceMs) return;
    lastConfirmAt = Date.now();
    onEvent({
      level: "confirmed",
      type: "TAB_SWITCH",
      reason: "You left the interview tab.",
      hiddenMs,
    });
  };

  const scheduleConfirm = () => {
    clearConfirmTimer();
    if (hiddenSince == null) return;
    const elapsed = Date.now() - hiddenSince;
    const wait = Math.max(0, config.sustainedHiddenMs - elapsed);
    confirmTimer = setTimeout(() => {
      if (disposed || !document.hidden || hiddenSince == null) return;
      if (suppressed()) return;
      const hiddenMs = Date.now() - hiddenSince;
      if (hiddenMs < config.sustainedHiddenMs) return;
      emitConfirmed(hiddenMs);
    }, wait);
  };

  const onVisibilityChange = () => {
    if (disposed) return;
    if (document.hidden) {
      if (suppressed()) {
        hiddenSince = null;
        clearConfirmTimer();
        return;
      }
      hiddenSince = Date.now();
      scheduleConfirm();
      return;
    }

    // Returned to the interview tab.
    if (hiddenSince != null && !suppressed()) {
      const hiddenMs = Date.now() - hiddenSince;
      // If they already stayed away long enough, confirm even if timer had not fired yet.
      if (hiddenMs >= config.sustainedHiddenMs) {
        emitConfirmed(hiddenMs);
      } else if (hiddenMs > 0) {
        onEvent({
          level: "transient",
          type: "FOCUS_FLICKER",
          reason: "Brief visibility change ignored.",
        });
      }
    }
    hiddenSince = null;
    clearConfirmTimer();
  };

  const onWindowBlur = () => {
    if (disposed || suppressed()) return;
    // Permission dialogs / notifications often blur without hiding the document.
    if (!document.hidden) {
      onEvent({
        level: "transient",
        type: "FOCUS_FLICKER",
        reason: "Window focus change ignored (permission dialog or notification).",
      });
    }
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("blur", onWindowBlur);

  return {
    notifyPermissionActivity() {
      permissionUntil = Date.now() + config.permissionSuppressMs;
      hiddenSince = null;
      clearConfirmTimer();
    },
    notifyCameraReady() {
      // Brief settle only — do not keep extending forever.
      graceUntil = Math.max(graceUntil, Date.now() + 2_000);
    },
    dispose() {
      disposed = true;
      clearConfirmTimer();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
    },
  };
}
