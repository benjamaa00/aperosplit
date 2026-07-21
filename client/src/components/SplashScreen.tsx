import { useState, useEffect, memo, useCallback } from "react";

const SPLASH_KEY = "equilibra_splash_shown";

function shouldShowSplash(): boolean {
 try {
 const stored = localStorage.getItem(SPLASH_KEY);
 if (!stored) return true;
 const today = new Date().toDateString();
 return stored !== today;
 } catch {
 return true;
 }
}

export const SplashScreen = memo(function SplashScreen({ onComplete }: { onComplete: () => void }) {
 const [fadeOut, setFadeOut] = useState(false);
 const [visible, setVisible] = useState(shouldShowSplash());

 const finish = useCallback(() => {
 if (fadeOut) return;
 setFadeOut(true);
 setTimeout(onComplete, 350);
 }, [fadeOut, onComplete]);

 useEffect(() => {
 if (!visible) {
 onComplete();
 return;
 }
 // Dismiss as soon as possible, min 400ms
 const minTimer = setTimeout(finish, 400);
 // Max timeout safety
 const maxTimer = setTimeout(finish, 1200);
 try { localStorage.setItem(SPLASH_KEY, new Date().toDateString()); } catch {}
 return () => { clearTimeout(minTimer); clearTimeout(maxTimer); };
 }, [visible, finish, onComplete]);

 if (!visible) return null;

 return (
 <div className={`splash-screen ${fadeOut ? "fade-out" : ""}`} role="status" aria-label="Chargement">
 <div className="splash-logo">
 <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
 <rect width="80" height="80" rx="20" fill="var(--primary)" />
 <path d="M25 42 C25 33, 32 26, 40 26 C48 26, 55 33, 55 42 C55 48, 52 50, 50 52 L30 52 C28 50, 25 48, 25 42Z" fill="white" fillOpacity="0.15" />
 <path d="M30 40 L36 46 L52 30" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
 <line x1="28" y1="56" x2="52" y2="56" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
 </svg>
 </div>
 <p className="splash-title">Equilibra</p>
 <p className="splash-subtitle">Partagez, equilibrez</p>
 </div>
 );
});

SplashScreen.displayName = "SplashScreen";
