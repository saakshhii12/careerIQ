export const TAB_VISIBILITY_CONFIG = {
  startupGraceMs: 3_500,
  permissionSuppressMs: 5_000,
  sustainedHiddenMs: 450,
  confirmDebounceMs: 1_200,
};

export function createTabVisibilityDetector(onEvent, config = TAB_VISIBILITY_CONFIG) {
  let graceUntil = Date.now() + config.startupGraceMs;
  let permissionUntil = 0;
  let hiddenSince = null;
  let confirmTimer = null;
  let lastConfirmAt = 0;
  let disposed = false;

  const suppressed = () => Date.now() < graceUntil || Date.now() < permissionUntil;

  const clearConfirmTimer = () => {
    if (confirmTimer) {
      clearTimeout(confirmTimer);
      confirmTimer = null;
    }
  };

  const emitConfirmed = (hiddenMs) => {
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
    if (hiddenSince != null && !suppressed()) {
      const hiddenMs = Date.now() - hiddenSince;
      if (hiddenMs >= config.sustainedHiddenMs) emitConfirmed(hiddenMs);
      else if (hiddenMs > 0) {
        onEvent({ level: "transient", type: "FOCUS_FLICKER", reason: "Brief visibility change ignored." });
      }
    }
    hiddenSince = null;
    clearConfirmTimer();
  };

  const onWindowBlur = () => {
    if (disposed || suppressed()) return;
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
