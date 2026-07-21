import { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.4, times: [0, 0.6, 1] }}
            className="rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
            style={{ width: size, height: size }}
          >
            <Check size={size * 0.5} className="text-primary-foreground" strokeWidth={3} />
          </motion.div>
          {/* Ripple rings */}
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              initial={{ scale: 0.5, opacity: 0.5 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" }}
              className="absolute rounded-full border-2 border-primary/30"
              style={{ width: size, height: size }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

SuccessAnimation.displayName = "SuccessAnimation";
