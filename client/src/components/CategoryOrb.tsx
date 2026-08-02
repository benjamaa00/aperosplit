import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationFrame } from "framer-motion";
import type { LucideIcon } from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const ENTER_DUR = 0.7;

function easeOutCubic(t: number) {
  const c = 1 - t;
  return 1 - c * c * c;
}

export interface CategoryOrbProps {
  image?: string;
  images?: string[];
  label: string;
  icon: LucideIcon;
  size?: number;
  x?: number;
  y?: number;
  delay?: number;
  speed?: number;
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
  speed = 0.08,
  startIndex = 0,
  swapInterval = 3200,
}: CategoryOrbProps) {
  const pool = images && images.length > 0 ? images : image ? [image] : [];
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const available = pool.filter((p) => !failed.has(p));
  const [idx, setIdx] = useState(() => (available.length ? startIndex % available.length : 0));

  const reduced = useMemo(
    () => typeof window !== "undefined" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false),
    []
  );

  const radius = Math.hypot(x, y);
  const angle0 = Math.atan2(y, x);
  const orbRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (available.length < 2 || reduced) return;
    const t = setInterval(() => setIdx((prev) => (prev + 1) % available.length), swapInterval);
    return () => clearInterval(t);
  }, [available.length, swapInterval, reduced]);

  useEffect(() => {
    const el = orbRef.current;
    if (!el || !reduced) return;
    el.style.transform = `translate(${x}px, ${y}px) scale(1)`;
    el.style.opacity = "1";
  }, [reduced, x, y]);

  useAnimationFrame((time) => {
    if (reduced) return;
    const el = orbRef.current;
    if (!el) return;
    if (startTimeRef.current === null) startTimeRef.current = time;
    const elapsed = (time - startTimeRef.current) / 1000;
    const t = Math.max(0, Math.min(1, (elapsed - delay) / ENTER_DUR));
    const e = easeOutCubic(t);
    const r = radius * e;
    const theta = angle0 + speed * Math.max(0, elapsed - delay);
    el.style.transform = `translate3d(${(r * Math.cos(theta)).toFixed(2)}px, ${(r * Math.sin(theta)).toFixed(2)}px, 0) scale(${(0.35 + 0.65 * e).toFixed(3)})`;
    el.style.opacity = Math.min(1, e / 0.2).toFixed(2);
  });

  const current = available.length ? available[idx % available.length] : null;

  return (
    <div className="orb-anchor" style={{ width: size, height: size }}>
      <div ref={orbRef} className="category-orb" role="img" aria-label={label} style={{ opacity: 0 }}>
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
      </div>
    </div>
  );
}
