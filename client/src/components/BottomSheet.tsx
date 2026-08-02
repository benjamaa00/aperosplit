import { type ReactNode } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  showClose?: boolean;
  maxHeight?: string;
}

export function BottomSheet({ open, onClose, children, title, showClose = true, maxHeight = "85vh" }: BottomSheetProps) {
  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[1100]">
            <motion.div
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={onClose}
            />
            <motion.div
              className="bottom-sheet absolute inset-x-0 bottom-0 mx-auto w-full max-w-md overflow-y-auto rounded-t-[1.75rem] pb-[max(2rem,env(safe-area-inset-bottom,0px))] [&::-webkit-scrollbar]:hidden"
              style={{ maxHeight }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 px-5 pb-2 pt-3">
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/25" />
                {title !== undefined || showClose ? (
                  <div className="mb-2 flex items-center justify-between">
                    <div>{title ?? <span />}</div>
                    {showClose && (
                      <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card/60 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
              <div className="px-5">{children}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
