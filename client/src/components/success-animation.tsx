import { memo, useEffect, useState } from "react";
import { Check } from "lucide-react";

interface SuccessAnimationProps {
 show: boolean;
 onComplete?: () => void;
 size?: number;
 duration?: number;
}

export const SuccessAnimation = memo(function SuccessAnimation({
 show, onComplete, size = 64, duration = 1500,
}: SuccessAnimationProps) {
 const [visible, setVisible] = useState(show);

 useEffect(() => {
 if (show) {
 setVisible(true);
 const timer = setTimeout(() => {
 setVisible(false);
 onComplete?.();
 }, duration);
 return () => clearTimeout(timer);
 }
 setVisible(false);
 }, [show, duration, onComplete]);

 return (
 
 {visible && (
 <div
 
 
 
 
 className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
 >
 <div
 
 
 
 className="rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
 style={{ width: size, height: size }}
 >
 <Check size={size * 0.5} className="text-primary-foreground" strokeWidth={3} />
 </div>
 {/* Ripple rings */}
 {[0, 1, 2].map(i => (
 <div
 key={i}
 initial={{ scale: 0.5, opacity: 0.5 }}
 
 
 className="absolute rounded-full border-2 border-primary/30"
 style={{ width: size, height: size }}
 />
 ))}
 </div>
 )}
 
 );
});

SuccessAnimation.displayName = "SuccessAnimation";
