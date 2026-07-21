const HAPTICS_KEY = "equilibra_haptics_enabled";

function isHapticSupported(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

function isSystemReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function isHapticsAllowed(): boolean {
  try {
    const stored = localStorage.getItem(HAPTICS_KEY);
    if (stored === "false") return false;
    if (stored === "true") return true;
  } catch {}
  return !isSystemReducedMotion();
}

export function areHapticsEnabled(): boolean {
  return isHapticSupported() && isHapticsAllowed();
}

export function setHapticsEnabled(enabled: boolean): void {
  try { localStorage.setItem(HAPTICS_KEY, String(enabled)); } catch {}
}

export const haptics = {
  light: () => { if (areHapticsEnabled()) navigator.vibrate(10); },
  medium: () => { if (areHapticsEnabled()) navigator.vibrate(20); },
  heavy: () => { if (areHapticsEnabled()) navigator.vibrate(40); },
  success: () => { if (areHapticsEnabled()) navigator.vibrate([10, 50, 20]); },
  error: () => { if (areHapticsEnabled()) navigator.vibrate([40, 30, 40, 30, 40]); },
  selection: () => { if (areHapticsEnabled()) navigator.vibrate(5); },
  warning: () => { if (areHapticsEnabled()) navigator.vibrate([30, 20, 30]); },
  off: () => {},
};
