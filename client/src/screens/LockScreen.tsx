import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Fingerprint, Check } from "lucide-react";
import type { Member } from "../types";
import { useHaptic } from "../hooks/useHaptic";
import { AvatarImg } from "../components/AvatarImg";
import { AuthShell, AUTH_ITEM_VARIANTS } from "../components/AuthShell";

export function LockScreen({ member, onUnlock, onSkip, onSwitchIdentity }: { member: Member; onUnlock: () => void; onSkip: () => void; onSwitchIdentity?: () => void }) {
  const [authenticating, setAuthenticating] = useState(false);
  const [authStatus, setAuthStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const haptic = useHaptic();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const handleUnlock = async () => {
    haptic("medium");
    setAuthenticating(true);
    setAuthStatus("scanning");
    try {
      await onUnlock();
    } catch {
      haptic("error");
      setAuthStatus("error");
      setAuthenticating(false);
    }
    timeoutRef.current = setTimeout(() => {
      setAuthenticating(prev => {
        if (prev) {
          haptic("error");
          setAuthStatus("error");
          return false;
        }
        return false;
      });
    }, 3000);
  };

  // Auto-trigger biometric on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleUnlock();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthShell>
      <motion.div variants={AUTH_ITEM_VARIANTS} className="flex flex-col items-center text-center">
        {/* Avatar with scan ring */}
        <div className="relative mb-8" style={{ width: "150px", height: "150px" }}>
          {authStatus === "scanning" && <div className="auth-avatar-ring" style={{ inset: "-0.625rem" }} />}
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />

          {authStatus === "success" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"
              >
                <Check size={40} className="text-white" />
              </motion.div>
            </div>
          )}

          <div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary/30 bg-gradient-to-br from-primary/20 to-primary/10 shadow-2xl shadow-primary/20 backdrop-blur-sm">
            <AvatarImg avatar={member.avatar} size="text-6xl" />
          </div>
        </div>

        {/* Name and status */}
        <div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight">{member.name}</h2>
          <p
            key={authStatus}
            className={`mb-10 text-sm font-medium ${
              authStatus === "success" ? "text-emerald-400" :
                authStatus === "error" ? "text-destructive" :
                  "text-muted-foreground"
            }`}
          >
            {authStatus === "scanning" && "Vérification biométrique..."}
            {authStatus === "success" && "Authentification réussie"}
            {authStatus === "error" && "Échec de l'authentification"}
            {authStatus === "idle" && "Utilisez Face ID ou Touch ID"}
          </p>
        </div>

        {/* Biometric button */}
        <motion.button
          type="button"
          onClick={handleUnlock}
          disabled={authenticating}
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.03 }}
          className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary/40 bg-gradient-to-br from-primary/30 to-primary/10 shadow-2xl shadow-primary/30 backdrop-blur-sm transition-colors hover:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className={`absolute inset-0 rounded-full bg-primary/20 blur-xl ${authStatus === "scanning" ? "animate-pulse" : ""}`} />
          <Fingerprint
            size={44}
            className={`relative z-10 text-primary ${authStatus === "scanning" ? "animate-pulse" : ""}`}
          />
        </motion.button>

        {/* Skip button */}
        <button
          type="button"
          onClick={onSkip}
          className="mb-4 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Continuer sans biométrie
        </button>

        {/* Switch identity button */}
        {onSwitchIdentity && (
          <button
            type="button"
            onClick={onSwitchIdentity}
            className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Changer de compte
          </button>
        )}
      </motion.div>
    </AuthShell>
  );
}
