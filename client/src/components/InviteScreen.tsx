import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Check, AlertTriangle, Users } from "lucide-react";
import { RegisterScreen } from "./RegisterScreen";
import { trpc } from "@/lib/trpc";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

interface InviteScreenProps {
  inviteToken: string;
  onJoinByInvite: (name: string, avatar: string) => Promise<{ success: boolean; error?: string }>;
  onBack?: () => void;
}

type InviteStep = "loading" | "register" | "joining" | "done" | "error";

export function InviteScreen({ inviteToken, onJoinByInvite, onBack }: InviteScreenProps) {
  const [step, setStep] = useState<InviteStep>("loading");
  const [groupName, setGroupName] = useState("");
  const [joinError, setJoinError] = useState("");
  const [memberName, setMemberName] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  const validateQuery = trpc.equilibra.validateInvite.useQuery(
    { token: inviteToken },
    { retry: false }
  );

  useEffect(() => {
    if (validateQuery.data) {
      if (validateQuery.data.valid) {
        setGroupName(validateQuery.data.groupName || "Équilibra");
        setStep("register");
      } else {
        const errMsg = validateQuery.data.error || "Lien d'invitation invalide";
        if (errMsg === "Offline mode" && retryCount < maxRetries) {
          const timer = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            validateQuery.refetch();
          }, 3000 * (retryCount + 1));
          return () => clearTimeout(timer);
        }
        setJoinError(errMsg === "Offline mode" ? "Le serveur demarre, veuillez patienter..." : errMsg);
        setStep("error");
      }
    }
  }, [validateQuery.data, validateQuery.isError, retryCount]);

  useEffect(() => {
    if (validateQuery.isError) {
      if (retryCount < maxRetries) {
        const timer = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          validateQuery.refetch();
        }, 3000 * (retryCount + 1));
        return () => clearTimeout(timer);
      }
      setJoinError("Impossible de verifier le lien. Verifiez votre connexion.");
      setStep("error");
    }
  }, [validateQuery.isError, retryCount]);

  const handleRegister = useCallback(async (name: string, avatar: string) => {
    setMemberName(name);
    setStep("joining");

    try {
      const result = await onJoinByInvite(name, avatar);
      if (result.success) {
        setStep("done");
      } else {
        setJoinError(result.error || "Erreur lors de l'inscription");
        setStep("error");
      }
    } catch {
      setJoinError("Erreur de connexion au serveur");
      setStep("error");
    }
  }, [onJoinByInvite]);

  return (
      <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/[0.07] rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-primary/[0.04] rounded-full blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {step === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6"
          >
            <Loader2 size={40} className="text-primary animate-spin mb-6" />
            <h2 className="text-xl font-bold tracking-tight mb-2">Verification du lien...</h2>
            <p className="text-muted-foreground text-sm text-center">
              {retryCount > 0 ? `Tentative ${retryCount + 1}/${maxRetries + 1}... Le serveur demarre` : "Chargement des informations du groupe"}
            </p>
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
              onBack={onBack}
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
              Bienvenue {memberName} ! Vous rejoignez « {groupName} »
            </p>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            key="done"
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
            <p className="text-muted-foreground text-sm text-center max-w-xs mb-4">
              Vous avez rejoint « {groupName} » avec succès.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users size={14} />
              <span>Chargement du groupe...</span>
            </div>
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
            <h2 className="text-2xl font-bold tracking-tight mb-2">Lien invalide</h2>
            <p className="text-muted-foreground text-sm text-center max-w-xs mb-6">
              {joinError}
            </p>
            <div className="flex gap-3 w-full max-w-xs">
              <motion.button
                onClick={() => onBack?.()}
                className="flex-1 bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl"
              >
                Retour
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
