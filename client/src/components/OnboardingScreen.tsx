import { useState, useRef, useCallback, memo, useEffect } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

const ONBOARDING_KEY = "equilibra_onboarding_done";

export function hasCompletedOnboarding(): boolean {
  try { return localStorage.getItem(ONBOARDING_KEY) === "1"; } catch { return false; }
}

function markOnboardingDone() {
  try { localStorage.setItem(ONBOARDING_KEY, "1"); } catch {}
}

interface OnboardingPage {
  image: string;
  gradient: string;
  glowColor: string;
}

const PAGES: OnboardingPage[] = [
  { image: "/onboarding/welcome.png", gradient: "linear-gradient(135deg, #7B2FF7, #C9A6FF)", glowColor: "rgba(123, 47, 247, 0.25)" },
  { image: "/onboarding/expense.png", gradient: "linear-gradient(135deg, #F97316, #FBBF24)", glowColor: "rgba(249, 115, 22, 0.25)" },
  { image: "/onboarding/balance.png", gradient: "linear-gradient(135deg, #10B981, #34D399)", glowColor: "rgba(16, 185, 129, 0.25)" },
  { image: "/onboarding/stats.png", gradient: "linear-gradient(135deg, #3B82F6, #60A5FA)", glowColor: "rgba(59, 130, 246, 0.25)" },
  { image: "/onboarding/security.png", gradient: "linear-gradient(135deg, #8B5CF6, #A78BFA)", glowColor: "rgba(139, 92, 246, 0.25)" },
  { image: "/onboarding/rocket.png", gradient: "linear-gradient(135deg, #EC4899, #F472B6)", glowColor: "rgba(236, 72, 153, 0.25)" },
];

export const OnboardingScreen = memo(function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [page, setPage] = useState(0);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [exiting, setExiting] = useState(false);
  const [entered, setEntered] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const t = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const goNext = useCallback(() => {
    if (page < PAGES.length - 1) {
      setSlideDir(1);
      setPage((p) => p + 1);
    } else {
      setExiting(true);
      markOnboardingDone();
      setTimeout(onComplete, 500);
    }
  }, [page, onComplete]);

  const goPrev = useCallback(() => {
    if (page > 0) {
      setSlideDir(-1);
      setPage((p) => p - 1);
    }
  }, [page]);

  const skip = useCallback(() => {
    setExiting(true);
    markOnboardingDone();
    setTimeout(onComplete, 500);
  }, [onComplete]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
  }, [goNext, goPrev]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, skip]);

  const current = PAGES[page];
  const isLast = page === PAGES.length - 1;

  return (
    <div
      className={`onboarding-screen ${exiting ? "onboarding-exit" : ""} ${entered ? "onboarding-entered" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="onboarding-bg" style={{ background: current.gradient, opacity: exiting ? 0 : 1 }} />
      <div className="onboarding-glow" style={{ background: `radial-gradient(circle, ${current.glowColor}, transparent 70%)` }} />

      {!isLast && (
        <button onClick={skip} className="onboarding-skip" type="button">
          Passer
        </button>
      )}

      <div className={`onboarding-page-container ${slideDir > 0 ? "slide-left" : "slide-right"}`} key={page}>
        <img
          src={current.image}
          alt=""
          className="onboarding-image"
          draggable={false}
        />
      </div>

      <div className="onboarding-bottom-overlay" />

      <div className="onboarding-content">
        <div className="onboarding-bottom">
          <div className="onboarding-dots">
            {PAGES.map((_, i) => (
              <div
                key={i}
                className={`onboarding-dot ${i === page ? "active" : ""} ${i < page ? "done" : ""}`}
                onClick={() => {
                  setSlideDir(i > page ? 1 : -1);
                  setPage(i);
                }}
              />
            ))}
          </div>

          <button onClick={goNext} className="onboarding-next" type="button">
            {isLast ? (
              <>
                <Sparkles size={18} />
                Commencer
              </>
            ) : (
              <>
                Suivant
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

OnboardingScreen.displayName = "OnboardingScreen";
