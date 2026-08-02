import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useHaptic } from "../hooks/useHaptic";
import { AuthShell, AUTH_ITEM_VARIANTS } from "../components/AuthShell";

export function AccessScreen({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const haptic = useHaptic();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, []);

  const handleSubmit = () => {
    if (code.trim()) {
      setLoading(true);
      haptic("success");
      timerRef.current = setTimeout(() => {
        onSubmit(code.trim());
        setLoading(false);
      }, 300);
    } else {
      haptic("error");
      toast.error("Veuillez entrer le code confidentiel");
    }
  };

  return (
    <AuthShell
      icon={Shield}
      title="Équilibra"
      subtitle="Entrez le code confidentiel du groupe"
      footer={
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/70">
          <Lock size={11} />
          Code chiffré, stocké uniquement sur cet appareil
        </div>
      }
    >
      <motion.div variants={AUTH_ITEM_VARIANTS} className="space-y-4">
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Code confidentiel"
          aria-label="Code confidentiel"
          className="auth-field"
          maxLength={20}
          autoFocus
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !code.trim()}
          className="auth-cta"
        >
          {loading ? "Vérification..." : (
            <>
              Accéder
              <ArrowRight size={17} strokeWidth={2.4} />
            </>
          )}
        </button>
      </motion.div>
    </AuthShell>
  );
}
