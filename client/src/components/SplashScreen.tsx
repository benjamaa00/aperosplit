import { useState, useEffect, memo, useCallback, useRef } from "react";

const SPLASH_KEY = "equilibra_splash_shown";
const SPLASH_DURATION = 6000;

function shouldShowSplash(): boolean {
  try {
    const stored = localStorage.getItem(SPLASH_KEY);
    if (!stored) return true;
    const today = new Date().toDateString();
    return stored !== today;
  } catch {
    return true;
  }
}

export const SplashScreen = memo(function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"idle" | "animating" | "exiting" | "done">("idle");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const cleanup = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    timersRef.current.push(setTimeout(fn, delay));
  }, []);

  useEffect(() => {
    if (!shouldShowSplash()) {
      onComplete();
      return;
    }

    try { localStorage.setItem(SPLASH_KEY, new Date().toDateString()); } catch {}

    setPhase("animating");

    schedule(() => setPhase("exiting"), SPLASH_DURATION - 500);
    schedule(() => {
      setPhase("done");
      onComplete();
    }, SPLASH_DURATION);

    return cleanup;
  }, [onComplete, schedule, cleanup]);

  if (phase === "done") return null;

  return (
    <div className={`splash-screen-new ${phase === "exiting" ? "splash-exit" : ""}`} role="status" aria-label="Chargement">
      {/* Sphere 1 — deep violet */}
      <div className="splash-sphere splash-sphere-1" />

      {/* Sphere 2 — light mauve */}
      <div className="splash-sphere splash-sphere-2" />

      {/* Vertical divider line */}
      <div className="splash-divider" />

      {/* Ripple wave */}
      <div className="splash-ripple" />

      {/* App name */}
      <div className="splash-brand">
        <span className="splash-brand-name">AperoSplit</span>
        <span className="splash-brand-tagline">Partagez, équilibrez</span>
      </div>
    </div>
  );
});

SplashScreen.displayName = "SplashScreen";
