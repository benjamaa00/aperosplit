import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, MotionConfig } from "framer-motion";
import { haptics } from "../utils/haptics";
import { CATEGORY_ORBS, CENTER_IMAGE, CENTER_ORB, INTRO_PHASE_AT, ORB_IMAGES } from "./introConfig";
import type { IntroPhase } from "./introConfig";
import { CategoryOrb } from "./CategoryOrb";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EXIT_MS = 550;
const PHASE_ORDER: IntroPhase[] = ["orbit", "converge", "name", "emerge", "drift"];

function CenterMark() {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="center-mark">
        <defs>
          <linearGradient id="asplit-grad" x1="5" y1="5" x2="19" y2="19" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="1" stopColor="#e9e0ff" stopOpacity="0.88" />
          </linearGradient>
        </defs>
        <circle cx="9" cy="12" r="6.4" stroke="url(#asplit-grad)" strokeWidth="1.9" />
        <circle cx="15" cy="12" r="6.4" stroke="url(#asplit-grad)" strokeWidth="1.9" />
      </svg>
    );
  }
  return (
    <img
      className="center-mark"
      src={CENTER_IMAGE}
      alt="AperoSplit"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

interface IntroScreenProps {
  onLogin: () => void;
}

export function IntroScreen({ onLogin }: IntroScreenProps) {
  const [exiting, setExiting] = useState(false);
  const exitingRef = useRef(false);
  const onLoginRef = useRef(onLogin);
  onLoginRef.current = onLogin;

  const [phase, setPhase] = useState<IntroPhase>("idle");
  const constellationRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (!exiting) return;
    const t = setTimeout(() => onLoginRef.current(), EXIT_MS);
    return () => clearTimeout(t);
  }, [exiting]);

  useEffect(() => {
    ORB_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const timers = PHASE_ORDER.map((p) => setTimeout(() => setPhase(p), INTRO_PHASE_AT[p]));
    return () => timers.forEach(clearTimeout);
  }, []);

  useLayoutEffect(() => {
    const measure = () => {
      const el = constellationRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ w: r.width, h: r.height });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const handleClick = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    haptics.light();
    setExiting(true);
  }, []);

  const cx = CENTER_ORB.x / 100;
  const cy = CENTER_ORB.y / 100;

  return (
    <MotionConfig reducedMotion="user">
      <div className={`intro-screen ${exiting ? "is-exiting" : ""}`}>
        <div className="intro-stage">
          <motion.div
            ref={constellationRef}
            className="intro-constellation"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={exiting ? { scale: 1.03, opacity: 0 } : { scale: 1, opacity: 1 }}
            transition={{ duration: EXIT_MS / 1000, ease: "easeInOut" }}
          >
            <div
              className="orb-anchor center-anchor"
              style={{
                left: `${CENTER_ORB.x}%`,
                top: `${CENTER_ORB.y}%`,
                width: `${CENTER_ORB.size}%`,
                zIndex: CENTER_ORB.zIndex,
              }}
            >
              <motion.div
                className="center-sphere"
                initial={{ opacity: 0, scale: 0.65 }}
                animate={
                  phase === "name"
                    ? { opacity: 1, scale: 1.05 }
                    : { opacity: 1, scale: 1 }
                }
                transition={
                  phase === "name"
                    ? { duration: 0.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
                    : { delay: 0.25, duration: 0.5, ease: EASE }
                }
              >
                <div className="center-breath">
                  <motion.div
                    className="center-mark-wrap"
                    animate={phase === "name" ? { opacity: 0, scale: 0.7 } : { opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    <CenterMark />
                  </motion.div>
                  <motion.div
                    className="center-name"
                    initial={false}
                    animate={phase === "name" ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    AperoSplit
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {rect &&
              CATEGORY_ORBS.map((orb, i) => (
                <CategoryOrb
                  key={orb.label}
                  images={ORB_IMAGES}
                  label={orb.label}
                  icon={orb.icon}
                  size={orb.size}
                  zIndex={orb.zIndex}
                  delay={0.55 + i * 0.09}
                  floatDuration={orb.floatDuration}
                  floatDelay={orb.floatDelay}
                  startIndex={orb.startIndex}
                  swapInterval={orb.swapInterval}
                  phase={phase}
                  index={i}
                  offsetX={(orb.x / 100 - cx) * rect.w}
                  offsetY={(orb.y / 100 - cy) * rect.h}
                />
              ))}
          </motion.div>

          <motion.div
            className="intro-copy"
            animate={exiting ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
            transition={{ duration: EXIT_MS / 1000, ease: "easeInOut" }}
          >
            <motion.h1
              className="intro-title"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5, ease: EASE }}
            >
              AperoSplit
            </motion.h1>

            <motion.button
              type="button"
              className="intro-button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.25, duration: 0.45, ease: EASE }}
              whileTap={{ scale: 0.96 }}
              onClick={handleClick}
            >
              Se connecter
            </motion.button>

            <motion.p
              className="intro-tagline"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5, ease: EASE }}
            >
              Toutes vos dépenses partagées, claires, équilibrées, au même endroit.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </MotionConfig>
  );
}
