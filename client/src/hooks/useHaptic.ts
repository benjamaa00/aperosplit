import { useCallback } from "react";

export function useHaptic() {
  const trigger = useCallback((type: "light" | "medium" | "heavy" | "success" | "error" | "selection") => {
    if (!navigator.vibrate) return;

    switch (type) {
      case "light":
        navigator.vibrate(10);
        break;
      case "medium":
        navigator.vibrate(20);
        break;
      case "heavy":
        navigator.vibrate(40);
        break;
      case "success":
        navigator.vibrate([10, 50, 10]);
        break;
      case "error":
        navigator.vibrate([30, 50, 30, 50, 30]);
        break;
      case "selection":
        navigator.vibrate(5);
        break;
    }
  }, []);

  return trigger;
}
