import { useState, useEffect, memo } from "react";

export const SplashScreen = memo(function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 400);
    }, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`splash-screen ${fadeOut ? "fade-out" : ""}`}>
      <div className="splash-logo">
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="80" height="80" rx="20" fill="var(--primary)" />
          <path
            d="M20 40 C20 28, 32 20, 40 20 C48 20, 60 28, 60 40 C60 52, 48 60, 40 60 C32 60, 20 52, 20 40Z"
            stroke="white"
            strokeWidth="3"
            fill="none"
            opacity="0.3"
          />
          <path
            d="M30 38 L37 45 L52 30"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="splash-title">Equilibra</p>
      <p className="splash-subtitle">Partagez,-equilibrez</p>
    </div>
  );
});

SplashScreen.displayName = "SplashScreen";
