import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";
import type { TutorialId } from "../utils/tutorialStorage";
import { markTutorialCompleted, saveTutorialStep, clearTutorialStep, getTutorialStep } from "../utils/tutorialStorage";

export interface TourStep {
  target: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
  adminOnly?: boolean;
  tab?: string;
}

interface GuidedTourProps {
  tutorialId: TutorialId;
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

export function GuidedTour({ tutorialId, steps, isOpen, onClose, isAdmin = false, currentTab, onTabChange }: GuidedTourProps) {
  const filteredSteps = steps.filter((s) => !s.adminOnly || isAdmin);
  const [current, setCurrent] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const target = filteredSteps[current];

  const measureTarget = useCallback(() => {
    if (!target) return;
    const el = document.querySelector(target.target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setTargetRect(el.getBoundingClientRect()), 350);
    } else {
      setTargetRect(null);
    }
  }, [target]);

  const navigateAndMeasure = useCallback((stepIndex: number) => {
    const step = filteredSteps[stepIndex];
    if (!step) return;

    if (step.tab && currentTab && step.tab !== currentTab && onTabChange) {
      onTabChange(step.tab);
      setTimeout(() => {
        const el = document.querySelector(step.target);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => setTargetRect(el.getBoundingClientRect()), 400);
        } else {
          setTargetRect(null);
        }
      }, 150);
    } else {
      const el = document.querySelector(step.target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => setTargetRect(el.getBoundingClientRect()), 350);
      } else {
        setTargetRect(null);
      }
    }
  }, [filteredSteps, currentTab, onTabChange]);

  useEffect(() => {
    if (!isOpen) return;
    navigateAndMeasure(current);
    const onResize = () => measureTarget();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => { window.removeEventListener("resize", onResize); window.removeEventListener("scroll", onResize, true); };
  }, [isOpen, current, navigateAndMeasure, measureTarget]);

  useEffect(() => {
    if (!isOpen) return;
    saveTutorialStep(tutorialId, current);
  }, [isOpen, current, tutorialId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { handleClose(); }
      if (e.key === "ArrowRight" || e.key === "Enter") { handleNext(); }
      if (e.key === "ArrowLeft") { handlePrev(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  });

  if (!isOpen || !target || filteredSteps.length === 0) return null;

  const total = filteredSteps.length;
  const progress = ((current + 1) / total) * 100;

  const handleNext = () => {
    if (current < total - 1) {
      setCurrent((c) => c + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  const handleClose = () => {
    markTutorialCompleted(tutorialId);
    clearTutorialStep(tutorialId);
    onClose();
  };

  const bubblePos = getBubblePosition(targetRect, target?.placement);

  return (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-label="Tutoriel">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={handleClose} />

      {targetRect && (
        <div
          className="absolute rounded-xl ring-2 ring-primary/60 bg-primary/10"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)",
          }}
        />
      )}

      <div
        ref={bubbleRef}
        className="absolute z-[201] w-[min(320px,calc(100vw-24px))] glass-card-enhanced rounded-2xl shadow-2xl overflow-hidden"
        style={{
          ...bubblePos,
          transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        <div className="h-1 bg-primary/20">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                {current + 1} / {total}
              </span>
            </div>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground p-1 -m-1" aria-label="Fermer le tutoriel" type="button">
              <X size={16} />
            </button>
          </div>

          <h3 className="text-sm font-bold mb-1">{target.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">{target.description}</p>

          <div className="flex items-center gap-2">
            {current > 0 && (
              <button
                onClick={handlePrev}
                type="button"
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <ChevronLeft size={14} />
                Précédent
              </button>
            )}

            <button
              onClick={() => handleClose()}
              type="button"
              className="px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Ignorer
            </button>

            <button
              onClick={handleNext}
              type="button"
              className="ml-auto flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground"
            >
              {current < total - 1 ? (
                <>Suivant <ChevronRight size={14} /></>
              ) : (
                "Terminer"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getBubblePosition(rect: DOMRect | null, placement?: string): React.CSSProperties {
  if (!rect) return { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const bubbleW = Math.min(320, vw - 24);
  const bubbleH = 200;
  const gap = 12;

  let top: number;
  let left: number;

  if (placement === "bottom" || (!placement && rect.bottom + gap + bubbleH < vh - 80)) {
    top = rect.bottom + gap;
    left = rect.left + rect.width / 2 - bubbleW / 2;
  } else if (placement === "top" || (!placement && rect.top - gap - bubbleH > 80)) {
    top = rect.top - bubbleH - gap;
    left = rect.left + rect.width / 2 - bubbleW / 2;
  } else if (placement === "left" || (!placement && rect.left - gap - bubbleW > 8)) {
    top = rect.top + rect.height / 2 - bubbleH / 2;
    left = rect.left - bubbleW - gap;
  } else {
    top = rect.bottom + gap;
    left = rect.left + rect.width / 2 - bubbleW / 2;
  }

  left = Math.max(12, Math.min(left, vw - bubbleW - 12));
  top = Math.max(12, Math.min(top, vh - bubbleH - 80));

  return { top: `${top}px`, left: `${left}px` };
}
