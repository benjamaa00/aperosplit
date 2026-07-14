import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, Check } from "lucide-react";
import { Member } from "../types";
import { fadeUp, spring } from "../constants";
import { useHaptic } from "../hooks/useHaptic";
import { AvatarImg } from "../components/AvatarImg";

export function LockScreen({ member, onUnlock, onSkip, onSwitchIdentity }: { member: Member; onUnlock: () => void; onSkip: () => void; onSwitchIdentity?: () => void }) {
  const [authenticating, setAuthenticating] = useState(false);
  const [authStatus, setAuthStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const haptic = useHaptic();

  const handleUnlock = async () => {
    haptic("medium");
    setAuthenticating(true);
    setAuthStatus("scanning");
    await onUnlock();
    // Success is determined by screen change to main (handled by parent)
    // If we're still on lock screen after a delay, it failed
    setTimeout(() => {
      if (authenticating) {
        haptic("error");
        setAuthStatus("error");
        setAuthenticating(false);
      }
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
        />
      </div>

      <motion.div {...fadeUp} className="text-center relative z-10">
        {/* Avatar with ring animation */}
        <div className="relative mb-8">
          {/* Scanning ring */}
          <motion.div
            animate={authStatus === "scanning" ? {
              rotate: 360,
              scale: [1, 1.05, 1],
            } : {}}
            transition={authStatus === "scanning" ? {
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
            } : {}}
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            style={{ width: "140px", height: "140px", margin: "-10px" }}
          />
          
          {/* Inner glow */}
          <motion.div
            animate={authStatus === "scanning" ? {
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.1, 1],
            } : authStatus === "success" ? {
              opacity: [1, 0],
              scale: [1, 2],
            } : {}}
            transition={authStatus === "scanning" ? {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            } : authStatus === "success" ? {
              duration: 0.5,
            } : {}}
            className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
          />

          {/* Success checkmark */}
          <AnimatePresence>
            {authStatus === "success" && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/50">
                  <Check size={40} className="text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Avatar */}
          <motion.div
            animate={authStatus === "scanning" ? {
              scale: [1, 1.02, 1],
            } : {}}
            transition={authStatus === "scanning" ? {
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            } : {}}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-sm"
          >
            <AvatarImg avatar={member.avatar} size="text-6xl" />
          </motion.div>
        </div>

        {/* Name and status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-2 tracking-tight">{member.name}</h2>
          <motion.p
            key={authStatus}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm font-medium mb-10 ${
              authStatus === "success" ? "text-green-400" : 
              authStatus === "error" ? "text-red-400" : 
              "text-muted-foreground"
            }`}
          >
            {authStatus === "scanning" && "Vérification biométrique..."}
            {authStatus === "success" && "Authentification réussie"}
            {authStatus === "error" && "Échec de l'authentification"}
            {authStatus === "idle" && "Utilisez Face ID ou Touch ID"}
          </motion.p>
        </motion.div>

        {/* Biometric button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={handleUnlock}
          disabled={authenticating}
          className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {/* Button glow */}
          <motion.div
            animate={authStatus === "scanning" ? {
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.2, 1],
            } : {}}
            transition={authStatus === "scanning" ? {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            } : {}}
            className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
          />
          
          <Fingerprint 
            size={44} 
            className={`text-primary relative z-10 ${
              authStatus === "scanning" ? "animate-pulse" : ""
            }`}
          />
        </motion.button>

        {/* Skip button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 underline-offset-4 hover:underline font-medium mb-4"
        >
          Continuer sans biométrie
        </motion.button>

        {/* Switch identity button */}
        {onSwitchIdentity && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onSwitchIdentity}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 underline-offset-4 hover:underline font-medium"
          >
            Changer de compte
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
