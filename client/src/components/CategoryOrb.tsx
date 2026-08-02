import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { CENTER_ORB, INTRO_MOTION } from "./introConfig";
import type { IntroPhase } from "./introConfig";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const ENTER_DURATION = 0.55;

export interface CategoryOrbProps {
  image?: string;
  images?: string[];
  label: string;
  icon: LucideIcon;
  /** diamètre en % de la largeur du conteneur */
  size?: number;
  zIndex?: number;
  delay?: number;
  floatDuration?: number;
  floatDelay?: number;
  startIndex?: number;
  swapInterval?: number;
  /** phase courante du cycle cinématique */
  phase: IntroPhase;
  /** index du satellite (pour le stagger à la sortie) */
  index: number;
  /** décalage en px par rapport au centre de la constellation (position de repos) */
  offsetX: number;
  offsetY: number;
}

export function CategoryOrb({
  image,
  images,
  label,
  icon: Icon,
  size = 16,
  zIndex = 1,
  delay = 0.55,
  floatDuration = 7,
  floatDelay = 0,
  startIndex = 0,
  swapInterval = 3200,
  phase,
  index,
  offsetX,
  offsetY,
}: CategoryOrbProps) {
  const pool = images && images.length > 0 ? images : image ? [image] : [];
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const available = pool.filter((p) => !failed.has(p));
  const [idx, setIdx] = useState(() => (available.length ? startIndex % available.length : 0));

  useEffect(() => {
    if (available.length < 2) return;
    const t = setInterval(() => setIdx((prev) => (prev + 1) % available.length), swapInterval);
    return () => clearInterval(t);
  }, [available.length, swapInterval]);

  const current = available.length ? available[idx % available.length] : null;

  const rest = { x: offsetX, y: offsetY, scale: 1, opacity: 1 };
  const centered = { x: 0, y: 0, scale: 0, opacity: 0 };

  const holderTarget = phase === "converge" || phase === "name" ? centered : rest;

  const holderTransition =
    phase === "converge"
      ? { duration: INTRO_MOTION.convergeMs / 1000, ease: EASE }
      : phase === "return"
        ? { duration: INTRO_MOTION.returnMs / 1000, ease: EASE, delay: index * 0.06 }
        : { duration: 0.5, ease: EASE };

  const style = {
    left: `${CENTER_ORB.x}%`,
    top: `${CENTER_ORB.y}%`,
    width: `${size}%`,
    zIndex,
    "--float-dur": `${floatDuration}s`,
    "--float-delay": `${floatDelay}s`,
    "--orb-spin-dur": `${INTRO_MOTION.spinDurationSec}s`,
  } as CSSProperties;

  return (
    <div
      className="category-orb"
      role="img"
      aria-label={label}
      style={style}
    >
      <div className="orb-orbit">
        <motion.div
          className="orb-holder"
          initial={rest}
          animate={holderTarget}
          transition={holderTransition}
        >
          <motion.div
            className="category-orb-inner"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: ENTER_DURATION, ease: EASE }}
          >
            <div className="orb-glass">
              <div className="orb-glyph">
                {current ? (
                  <AnimatePresence initial={false} mode="wait">
                    <motion.img
                      key={current}
                      className="orb-img"
                      src={current}
                      alt={label}
                      loading="eager"
                      draggable={false}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      onError={() => setFailed((prev) => new Set(prev).add(current))}
                    />
                  </AnimatePresence>
                ) : (
                  <Icon className="orb-icon" strokeWidth={1.8} />
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
