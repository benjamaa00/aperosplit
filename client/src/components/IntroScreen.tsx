import { useCallback, useEffect, useRef, useState } from "react";
import { motion, MotionConfig } from "framer-motion";
import { Car, Gamepad2, House, Plane, Receipt, ShoppingBag, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { haptics } from "../utils/haptics";
import { CategoryOrb } from "./CategoryOrb";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EXIT_MS = 550;

const CENTER_IMAGE = "/categories/aperosplit_icon.png";

const ORB_IMAGES = [
  CENTER_IMAGE,
  "/categories/aperosplit_bell_final.png",
  "/categories/aperosplit_calendar_final.png",
  "/categories/aperosplit_card_final.png",
  "/categories/aperosplit_cocktail_final.png",
  "/categories/aperosplit_gift_final.png",
  "/categories/aperosplit_group_final.png",
  "/categories/aperosplit_piggy_bank_final.png",
  "/categories/aperosplit_receipt_final.png",
  "/categories/aperosplit_rocket_final.png",
  "/categories/aperosplit_shopping_bag_final.png",
];

interface OrbConfig {
  label: string;
  icon: LucideIcon;
  x: number;
  y: number;
  size: number;
  speed: number;
  startIndex: number;
  swapInterval: number;
}

const CATEGORY_ORBS: OrbConfig[] = [
  { label: "Transport", icon: Car, x: 12, y: -86, size: 48, speed: 0.06, startIndex: 0, swapInterval: 2600 },
  { label: "Voyage", icon: Plane, x: 82, y: -52, size: 48, speed: 0.09, startIndex: 3, swapInterval: 2950 },
  { label: "Shopping", icon: ShoppingBag, x: 98, y: 12, size: 48, speed: -0.05, startIndex: 6, swapInterval: 3300 },
  { label: "Loisirs", icon: Gamepad2, x: 54, y: 70, size: 42, speed: 0.11, startIndex: 9, swapInterval: 3650 },
  { label: "Logement", icon: House, x: -46, y: 73, size: 42, speed: -0.07, startIndex: 1, swapInterval: 4000 },
  { label: "Nourriture", icon: Utensils, x: -93, y: 20, size: 36, speed: 0.08, startIndex: 4, swapInterval: 4350 },
  { label: "Factures", icon: Receipt, x: -80, y: -52, size: 36, speed: -0.06, startIndex: 7, swapInterval: 4700 },
];

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

  const handleClick = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    haptics.light();
    setExiting(true);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className={`intro-screen ${exiting ? "is-exiting" : ""}`}>
        <div className="intro-stage">
          <motion.div
            className="intro-constellation"
            animate={exiting ? { scale: 1.03, opacity: 0 } : { scale: 1, opacity: 1 }}
            transition={{ duration: EXIT_MS / 1000, ease: "easeInOut" }}
          >
            <div className="orb-anchor center-anchor">
              <motion.div
                className="center-sphere"
                initial={{ opacity: 0, scale: 0.65 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.45, ease: EASE }}
              >
                <div className="center-breath">
                  <CenterMark />
                </div>
              </motion.div>
            </div>

            {CATEGORY_ORBS.map((orb, i) => (
              <CategoryOrb
                key={orb.label}
                images={ORB_IMAGES}
                label={orb.label}
                icon={orb.icon}
                x={orb.x}
                y={orb.y}
                size={orb.size}
                delay={0.55 + i * 0.1}
                speed={orb.speed}
                startIndex={orb.startIndex}
                swapInterval={orb.swapInterval}
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
              transition={{ delay: 0.85, duration: 0.5, ease: EASE }}
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
