import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Users } from "lucide-react";
import { AvatarImg } from "./AvatarImg";

interface Member {
  id: string;
  name: string;
  avatar: string;
  role?: string;
}

interface MemberSelectProps {
  members: Member[];
  selected: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  allLabel?: string;
  className?: string;
}

export function MemberSelect({
  members,
  selected,
  onChange,
  placeholder = "Filtrer par membre",
  allLabel = "Tout le groupe",
  className = "",
}: MemberSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedMember = members.find(m => m.id === selected);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 py-3 px-4 rounded-2xl bg-card/50 border border-border text-sm font-medium text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {selectedMember ? (
          <>
            <span className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-base shrink-0">
              <AvatarImg avatar={selectedMember.avatar} size="text-base" />
            </span>
            <span className="flex-1 text-left truncate">{selectedMember.name}</span>
          </>
        ) : (
          <>
            <span className="w-8 h-8 rounded-full bg-muted/50 border border-border flex items-center justify-center shrink-0">
              <Users size={14} className="text-muted-foreground" />
            </span>
            <span className="flex-1 text-left text-muted-foreground">{allLabel}</span>
          </>
        )}
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full bg-card border border-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden backdrop-blur-xl"
          >
            <div className="max-h-64 overflow-y-auto p-1.5">
              {/* All members option */}
              <button
                onClick={() => { onChange(null); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  !selected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="w-8 h-8 rounded-full bg-muted/50 border border-border flex items-center justify-center shrink-0">
                  <Users size={14} />
                </span>
                <span className="flex-1 text-left">{allLabel}</span>
                {!selected && <Check size={16} className="text-primary shrink-0" />}
              </button>

              {/* Member options */}
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => { onChange(m.id); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    selected === m.id ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-base shrink-0">
                    <AvatarImg avatar={m.avatar} size="text-base" />
                  </span>
                  <span className="flex-1 text-left truncate">{m.name}</span>
                  {selected === m.id && <Check size={16} className="text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
