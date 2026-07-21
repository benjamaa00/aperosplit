const isVibrationSupported = typeof navigator !== "undefined" && "vibrate" in navigator;

export const haptics = {
  light: () => { if (isVibrationSupported) navigator.vibrate(10); },
  medium: () => { if (isVibrationSupported) navigator.vibrate(20); },
  heavy: () => { if (isVibrationSupported) navigator.vibrate(40); },
  success: () => { if (isVibrationSupported) navigator.vibrate([10, 50, 20]); },
  error: () => { if (isVibrationSupported) navigator.vibrate([40, 30, 40, 30, 40]); },
  selection: () => { if (isVibrationSupported) navigator.vibrate(5); },
  warning: () => { if (isVibrationSupported) navigator.vibrate([30, 20, 30]); },
};
