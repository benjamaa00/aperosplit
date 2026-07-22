import { useState, useRef, useEffect, useCallback } from "react";
import { Info, HelpCircle, X } from "lucide-react";

interface HelpPopoverProps {
  title: string;
  description: string;
  extra?: string;
  variant?: "info" | "question";
  size?: number;
}

export function HelpIcon({ title, description, extra, variant = "info", size = 14 }: HelpPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) && ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => { document.removeEventListener("keydown", handleKey); document.removeEventListener("mousedown", handleClick); };
  }, [open, close]);

  const Icon = variant === "info" ? Info : HelpCircle;

  return (
    <>
      <button
        ref={ref}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="inline-flex items-center justify-center w-[28px] h-[28px] rounded-full text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors flex-shrink-0"
        aria-label={title}
        type="button"
      >
        <Icon size={size} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={close} />
          <div
            ref={popoverRef}
            role="dialog"
            aria-label={title}
            className="fixed z-[91] w-[min(320px,calc(100vw-32px))] glass-card-enhanced rounded-2xl p-4 shadow-xl"
            style={getPopoverPosition(ref.current)}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="text-sm font-semibold">{title}</h4>
              <button onClick={close} className="text-muted-foreground hover:text-foreground p-0.5 -mt-0.5" aria-label="Fermer" type="button">
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            {extra && <p className="text-[11px] text-muted-foreground/70 leading-relaxed mt-2">{extra}</p>}
          </div>
        </>
      )}
    </>
  );
}

function getPopoverPosition(trigger: HTMLElement | null): React.CSSProperties {
  if (!trigger) return { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  const rect = trigger.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const popW = Math.min(320, vw - 32);
  const popH = 140;

  let top: number;
  let left: number;

  if (rect.top > popH + 16) {
    top = rect.top - popH - 8;
  } else {
    top = rect.bottom + 8;
  }
  left = rect.left + rect.width / 2 - popW / 2;
  left = Math.max(16, Math.min(left, vw - popW - 16));
  top = Math.max(8, Math.min(top, vh - popH - 8));

  return { top: `${top}px`, left: `${left}px` };
}
