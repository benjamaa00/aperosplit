import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, MotionConfig } from "framer-motion";
import { haptics } from "../utils/haptics";
import { CATEGORY_ORBS, CENTER_IMAGE, CENTER_ORB, INTRO_CYCLE_MS, INTRO_MOTION, INTRO_PHASE_AT, ORB_IMAGES } from "./introConfig";
import type { IntroPhase } from "./introConfig";
import { CategoryOrb } from "./CategoryOrb";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EXIT_MS = 550;
const PHASE_ORDER: Exclude<IntroPhase, "orbit">[] = ["converge", "name", "return"];

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

  const [phase, setPhase] = useState<IntroPhase>("orbit");
  const constellationRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [constellation, setConstellation] = useState<{ left: number; top: number; w: number; h: number } | null>(null);
  const [rise, setRise] = useState<{ dx: number; dy: number } | null>(null);

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

  // cycle cinématique : se répète toutes les INTRO_CYCLE_MS
  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = [];
    const loop = () => {
      timers = PHASE_ORDER.map((p) => setTimeout(() => setPhase(p), INTRO_PHASE_AT[p]));
      timers.push(
        setTimeout(() => {
          setPhase("orbit");
          loop();
        }, INTRO_CYCLE_MS),
      );
    };
    loop();
    return () => timers.forEach(clearTimeout);
  }, []);

  useLayoutEffect(() => {
    const measure = () => {
      const el = constellationRef.current;
      const t = titleRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setConstellation({ left: r.left, top: r.top, w: r.width, h: r.height });
      if (t) {
        const tr = t.getBoundingClientRect();
        const ax = r.left + r.width * (CENTER_ORB.x / 100);
        const ay = r.top + r.height * (CENTER_ORB.y / 100);
        setRise({ dx: ax - (tr.left + tr.width / 2), dy: ay - (tr.top + tr.height / 2) });
      }
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
  const isNaming = phase === "name" || phase === "return";

  return (
    <MotionConfig reducedMotion="user">
      <div className={`intro-screen ${exiting ? "is-exiting" : ""}`}>
        <div className="intro-stage">
          <motion.div
            className="intro-aura"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={
              exiting
                ? { opacity: 0, scale: 1.1 }
                : phase === "name"
                  ? { opacity: 0.95, scale: 1.05 }
                  : { opacity: 0.5, scale: 1 }
            }
            transition={
              exiting
                ? { duration: EXIT_MS / 1000, ease: "easeInOut" }
                : phase === "name"
                  ? { duration: INTRO_MOTION.sphereFadeOutMs / 1000, ease: EASE }
                  : { delay: 0.5, duration: 1.6, ease: "easeOut" }
            }
          />
          <motion.div
            ref={constellationRef}
            className="intro-constellation"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={exiting ? { scale: 1.04, opacity: 0 } : { scale: 1, opacity: 1 }}
            transition={exiting ? { duration: EXIT_MS / 1000, ease: "easeInOut" } : { duration: 0.9, ease: EASE }}
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
                animate={phase === "name" ? { opacity: 0, scale: 1.12 } : { opacity: 1, scale: 1 }}
                transition={
                  phase === "name"
                    ? { duration: INTRO_MOTION.sphereFadeOutMs / 1000, ease: EASE }
                    : phase === "return"
                      ? { duration: INTRO_MOTION.returnMs / 1000, ease: EASE }
                      : { delay: 0.25, duration: 0.5, ease: EASE }
                }
              >
                <div className="center-breath">
                  <CenterMark />
                </div>
              </motion.div>
            </div>

            {constellation &&
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
                  offsetX={(orb.x / 100 - cx) * constellation.w}
                  offsetY={(orb.y / 100 - cy) * constellation.h}
                />
              ))}
          </motion.div>

          <motion.div
            className="intro-copy"
            animate={exiting ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
            transition={{ duration: EXIT_MS / 1000, ease: "easeInOut" }}
          >
            <motion.h1
              ref={titleRef}
              className={`intro-title${isNaming ? " is-naming" : ""}`}
              initial={{ opacity: 0, y: 12 }}
              animate={
                phase === "name" && rise
                  ? { x: rise.dx, y: rise.dy, scale: INTRO_MOTION.titleScale, opacity: 1 }
                  : { x: 0, y: 0, scale: 1, opacity: 1 }
              }
              transition={
                phase === "name"
                  ? { duration: INTRO_MOTION.nameRiseMs / 1000, ease: EASE }
                  : phase === "return"
                    ? { duration: INTRO_MOTION.returnMs / 1000, ease: EASE }
                    : { delay: 0.9, duration: 0.6, ease: EASE }
              }
            >
              AperoSplit
            </motion.h1>

            <motion.button
              type="button"
              className="intro-button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.25, duration: 0.45, ease: EASE }}
              whileHover={{ scale: 1.03 }}
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
