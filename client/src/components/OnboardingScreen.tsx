import { useState, useRef, useCallback, memo, useEffect } from "react";
import { ChevronRight, ArrowRight, Sparkles } from "lucide-react";

const ONBOARDING_KEY = "equilibra_onboarding_done";

export function hasCompletedOnboarding(): boolean {
  try { return localStorage.getItem(ONBOARDING_KEY) === "1"; } catch { return false; }
}

function markOnboardingDone() {
  try { localStorage.setItem(ONBOARDING_KEY, "1"); } catch {}
}

interface OnboardingPage {
  emoji: string;
  gradient: string;
  glowColor: string;
  title: string;
  description: string;
}

const PAGES: OnboardingPage[] = [
  {
    emoji: "🥂",
    gradient: "linear-gradient(135deg, #7B2FF7, #C9A6FF)",
    glowColor: "rgba(123, 47, 247, 0.25)",
    title: "Bienvenue sur\nAperoSplit",
    description: "L'application qui simplifie le partage de dépenses entre amis. Fini les calculs compliqués et les oublis.",
  },
  {
    emoji: "💸",
    gradient: "linear-gradient(135deg, #F97316, #FBBF24)",
    glowColor: "rgba(249, 115, 22, 0.25)",
    title: "Enregistrez vos\ndépenses en 2 secondes",
    description: "Ajoutez un achat, choisissez les participants, c'est fait. La répartition est automatique et instantanée.",
  },
  {
    emoji: "⚖️",
    gradient: "linear-gradient(135deg, #10B981, #34D399)",
    glowColor: "rgba(16, 185, 129, 0.25)",
    title: "Soldes\nintelligents",
    description: "Notre algorithme réduit le nombre de remboursements nécessaires. Moins de virements, plus de simplicité.",
  },
  {
    emoji: "📊",
    gradient: "linear-gradient(135deg, #3B82F6, #60A5FA)",
    glowColor: "rgba(59, 130, 246, 0.25)",
    title: "Statistiques\n détaillées",
    description: "Visualisez où va votre argent avec des graphiques élégants. Catégories, tendances, budgets, tout est là.",
  },
  {
    emoji: "🔒",
    gradient: "linear-gradient(135deg, #8B5CF6, #A78BFA)",
    glowColor: "rgba(139, 92, 246, 0.25)",
    title: "Sécurité\ntotale",
    description: "Verrouillage biométrique, mode privé pour masquer les montants. Vos données restent entre vous.",
  },
  {
    emoji: "🚀",
    gradient: "linear-gradient(135deg, #EC4899, #F472B6)",
    glowColor: "rgba(236, 72, 153, 0.25)",
    title: "C'est parti !",
    description: "Créez votre groupe, invitez vos amis et commencez à partager vos dépenses en toute simplicité.",
  },
];

export const OnboardingScreen = memo(function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [page, setPage] = useState(0);
  const [exiting, setExiting] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const goNext = useCallback(() => {
    if (page < PAGES.length - 1) {
      setPage((p) => p + 1);
    } else {
      setExiting(true);
      markOnboardingDone();
      setTimeout(onComplete, 450);
    }
  }, [page, onComplete]);

  const goPrev = useCallback(() => {
    if (page > 0) setPage((p) => p - 1);
  }, [page]);

  const skip = useCallback(() => {
    setExiting(true);
    markOnboardingDone();
    setTimeout(onComplete, 450);
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
      className={`onboarding-screen ${exiting ? "onboarding-exit" : ""}`}
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background gradient */}
      <div className="onboarding-bg" style={{ background: current.gradient, opacity: exiting ? 0 : 1 }} />

      {/* Glow orb */}
      <div className="onboarding-glow" style={{ background: `radial-gradient(circle, ${current.glowColor}, transparent 70%)` }} />

      {/* Skip button */}
      {!isLast && (
        <button onClick={skip} className="onboarding-skip" type="button">
          Passer
        </button>
      )}

      {/* Content */}
      <div className="onboarding-content">
        <div
          className="onboarding-emoji"
          key={page}
          style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px)" }}
        >
          <span>{current.emoji}</span>
        </div>

        <h2 className="onboarding-title" key={`t-${page}`}>
          {current.title}
        </h2>
        <p className="onboarding-desc" key={`d-${page}`}>
          {current.description}
        </p>
      </div>

      {/* Bottom section */}
      <div className="onboarding-bottom">
        {/* Page dots */}
        <div className="onboarding-dots">
          {PAGES.map((_, i) => (
            <div
              key={i}
              className={`onboarding-dot ${i === page ? "active" : ""} ${i < page ? "done" : ""}`}
              onClick={() => setPage(i)}
            />
          ))}
        </div>

        {/* Next / CTA button */}
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
  );
});

OnboardingScreen.displayName = "OnboardingScreen";
