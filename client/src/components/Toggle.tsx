import { memo } from "react";
import { motion } from "framer-motion";
import { spring } from "../constants";
import { haptics } from "../utils/haptics";

interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const Toggle = memo(({ enabled, onToggle, disabled }: ToggleProps) => (
  <motion.button
    whileTap={disabled ? undefined : { scale: 0.95 }}
    onClick={() => { if (!disabled) { haptics.selection(); onToggle(); } }}
    className={`w-[52px] h-8 rounded-full transition-colors duration-300 relative flex-shrink-0 ${
      enabled ? "bg-primary shadow-lg shadow-primary/30" : "bg-secondary"
    } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
  >
    <motion.div
      animate={{ x: enabled ? 22 : 3 }}
      transition={spring}
      className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md"
    />
  </motion.button>
));
Toggle.displayName = "Toggle";
