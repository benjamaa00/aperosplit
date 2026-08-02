import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const ENTER_DURATION = 0.55;

export interface CategoryOrbProps {
  image?: string;
  images?: string[];
  label: string;
  icon: LucideIcon;
  size?: number;
  x?: number;
  y?: number;
  delay?: number;
  floatDuration?: number;
  floatDelay?: number;
  startIndex?: number;
  swapInterval?: number;
}

export function CategoryOrb({
  image,
  images,
  label,
  icon: Icon,
  size = 48,
  x = 0,
  y = 0,
  delay = 0.55,
  floatDuration = 7,
  floatDelay = 0,
  startIndex = 0,
  swapInterval = 3200,
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
  const half = size / 2;
  const style = {
    width: size,
    height: size,
    left: `calc(50% - ${half}px + ${x}px)`,
    top: `calc(50% - ${half}px + ${y}px)`,
    "--float-dur": `${floatDuration}s`,
    "--float-delay": `${floatDelay}s`,
  } as CSSProperties;

  return (
    <motion.div
      className="category-orb"
      role="img"
      aria-label={label}
      style={style}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: ENTER_DURATION, ease: EASE }}
    >
      <div className="orb-glass">
        {current ? (
          <AnimatePresence initial={false}>
            <motion.img
              key={current}
              className="orb-img"
              src={current}
              alt={label}
              loading="eager"
              draggable={false}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              onError={() => setFailed((prev) => new Set(prev).add(current))}
            />
          </AnimatePresence>
        ) : (
          <Icon className="orb-icon" strokeWidth={1.8} />
        )}
      </div>
    </motion.div>
  );
}
