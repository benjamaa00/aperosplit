import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Shield, Lock, Check, AlertTriangle, Loader2,
} from "lucide-react";
import { RegisterScreen } from "./RegisterScreen";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

interface InviteScreenProps {
  inviteToken: string;
  onJoinByPin: (pinCode: string, name: string, avatar: string) => Promise<{ success: boolean; error?: string }>;
  onJoinByInvite: (name: string, avatar: string) => Promise<{ success: boolean; error?: string }>;
  onBack?: () => void;
  groupName?: string;
}

type InviteStep = "pin" | "register" | "joining" | "success" | "error";

export function InviteScreen({ inviteToken, onJoinByPin, onJoinByInvite, onBack, groupName }: InviteScreenProps) {
  const [step, setStep] = useState<InviteStep>("pin");
  const [pinCode, setPinCode] = useState("");
  const [pinError, setPinError] = useState("");
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberAvatar, setMemberAvatar] = useState("");

  useEffect(() => {
    if (inviteToken) {
      setStep("register");
    }
  }, [inviteToken]);

  const handlePinSubmit = useCallback(() => {
    if (pinCode.length < 4) {
      setPinError("Le code PIN doit contenir au moins 4 chiffres");
      return;
    }
    setIsVerifyingPin(true);
    setPinError("");

    setTimeout(() => {
      setIsVerifyingPin(false);
      setStep("register");
    }, 800);
  }, [pinCode]);

  const handleRegister = useCallback(async (name: string, avatar: string) => {
    setMemberName(name);
    setMemberAvatar(avatar);
    setStep("joining");

    try {
      let result;
      if (pinCode) {
        result = await onJoinByPin(pinCode, name, avatar);
      } else {
        result = await onJoinByInvite(name, avatar);
      }

      if (result.success) {
        setStep("success");
      } else {
        setJoinError(result.error || "Erreur lors de l'inscription");
        setStep("error");
      }
    } catch {
      setJoinError("Erreur de connexion au serveur");
      setStep("error");
    }
  }, [pinCode, onJoinByPin, onJoinByInvite]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
        />
      </div>

      <AnimatePresence mode="wait">
        {step === "pin" && (
          <motion.div
            key="pin"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6"
          >
            {onBack && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onBack}
                className="absolute top-6 left-6 w-10 h-10 rounded-2xl bg-card/30 border border-border flex items-center justify-center"
              >
                <ArrowLeft size={20} />
              </motion.button>
            )}

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, ...spring }}
              className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10"
            >
              <Lock size={28} className="text-primary" />
            </motion.div>

            <h1 className="text-2xl font-bold tracking-tight text-center mb-1">
              Code d'accès
            </h1>
            <p className="text-muted-foreground text-sm text-center mb-8">
              {groupName ? `Entrez le PIN pour rejoindre "${groupName}"` : "Entrez le code PIN du groupe"}
            </p>

            <div className="w-full max-w-xs space-y-4">
              <input
                type="password"
                inputMode="numeric"
                value={pinCode}
                onChange={(e) => {
                  setPinCode(e.target.value.replace(/\D/g, "").slice(0, 12));
                  setPinError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
                placeholder="••••••"
                autoFocus
                className="w-full bg-card/50 border border-border rounded-2xl px-5 py-4 text-2xl font-bold text-center tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20 transition-all placeholder:text-muted-foreground/30"
              />

              {pinError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-400 text-sm"
                >
                  <AlertTriangle size={14} />
                  {pinError}
                </motion.div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handlePinSubmit}
                disabled={pinCode.length < 4 || isVerifyingPin}
                className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-xl shadow-primary/25 text-base disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isVerifyingPin ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Shield size={18} />
                    Vérifier
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === "register" && (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <RegisterScreen
              onRegister={handleRegister}
              onBack={inviteToken ? onBack : () => setStep("pin")}
              groupName={groupName}
            />
          </motion.div>
        )}

        {step === "joining" && (
          <motion.div
            key="joining"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mb-6"
            >
              <Loader2 size={40} className="text-primary" />
            </motion.div>
            <h2 className="text-xl font-bold tracking-tight mb-2">Inscription en cours...</h2>
            <p className="text-muted-foreground text-sm text-center">
              Bienvenue {memberName} ! Configuration de votre profil.
            </p>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...spring, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6"
            >
              <Check size={36} className="text-green-500" />
            </motion.div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Bienvenue {memberName} !</h2>
            <p className="text-muted-foreground text-sm text-center max-w-xs">
              Vous avez rejoint le groupe avec succès. Redirection...
            </p>
          </motion.div>
        )}

        {step === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...spring }}
              className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6"
            >
              <AlertTriangle size={36} className="text-red-400" />
            </motion.div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Erreur</h2>
            <p className="text-muted-foreground text-sm text-center max-w-xs mb-6">
              {joinError}
            </p>
            <div className="flex gap-3 w-full max-w-xs">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setStep(inviteToken ? "register" : "pin"); setPinCode(""); setJoinError(""); }}
                className="flex-1 bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl"
              >
                Réessayer
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
