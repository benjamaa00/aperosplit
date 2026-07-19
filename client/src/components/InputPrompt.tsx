import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";

interface InputPromptProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: "text" | "number";
  confirmLabel?: string;
}

export function InputPrompt({
  open,
  onClose,
  onConfirm,
  title,
  description,
  defaultValue = "",
  placeholder = "",
  type = "text",
  confirmLabel = "Confirmer",
}: InputPromptProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open, defaultValue]);

  const handleSubmit = () => {
    if (value.trim()) {
      onConfirm(value.trim());
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            >
              <X size={14} />
            </button>

            <h3 className="text-lg font-bold text-center mb-1">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground text-center mb-4">{description}</p>
            )}

            <input
              ref={inputRef}
              type={type}
              inputMode={type === "number" ? "decimal" : "text"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder={placeholder}
              className="w-full bg-background border border-border rounded-2xl px-4 py-3.5 text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-muted/30 text-foreground font-semibold py-3 rounded-2xl text-sm hover:bg-muted/50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={!value.trim()}
                className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-2xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check size={14} />
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
