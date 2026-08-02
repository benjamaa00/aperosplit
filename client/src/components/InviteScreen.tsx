import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Check, AlertTriangle, Users, RotateCcw, ArrowLeft } from "lucide-react";
import { RegisterScreen } from "./RegisterScreen";
import { AuthShell, AUTH_ITEM_VARIANTS, AUTH_EASE } from "./AuthShell";
import { trpc } from "@/lib/trpc";

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

  const handleRetry = useCallback(() => {
    setJoinError("");
    setRetryCount(0);
    setStep("loading");
    validateQuery.refetch();
  }, [validateQuery]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {step === "register" ? (
        <motion.div
          key="register"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          <RegisterScreen
            onRegister={handleRegister}
            onBack={onBack}
            groupName={groupName}
          />
        </motion.div>
      ) : (
        <AuthShell key={step}>
          <motion.div
            key={step}
            variants={AUTH_ITEM_VARIANTS}
            className="flex flex-col items-center text-center"
          >
            {step === "loading" && (
              <>
                <div className="relative mb-7">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-card/50 backdrop-blur-sm">
                    <Loader2 size={34} className="animate-spin text-primary" />
                  </div>
                </div>
                <h2 className="mb-2 text-xl font-bold tracking-tight">Verification du lien...</h2>
                <p className="max-w-xs text-sm text-muted-foreground">
                  {retryCount > 0 ? `Tentative ${retryCount + 1}/${maxRetries + 1}... Le serveur demarre` : "Chargement des informations du groupe"}
                </p>
              </>
            )}

            {step === "joining" && (
              <>
                <div className="relative mb-7">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-card/50 backdrop-blur-sm">
                    <Loader2 size={34} className="animate-spin text-primary" />
                  </div>
                </div>
                <h2 className="mb-2 text-xl font-bold tracking-tight">Inscription en cours...</h2>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Bienvenue {memberName} ! Vous rejoignez « {groupName} »
                </p>
              </>
            )}

            {step === "done" && (
              <>
                <div className="relative mb-7">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl" />
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className="relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10 shadow-lg shadow-emerald-500/20 backdrop-blur-sm"
                  >
                    <Check size={36} className="text-emerald-500" />
                  </motion.div>
                </div>
                <h2 className="mb-2 text-2xl font-bold tracking-tight">Bienvenue {memberName} !</h2>
                <p className="mb-4 max-w-xs text-sm text-muted-foreground">
                  Vous avez rejoint « {groupName} » avec succès.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users size={14} />
                  <span>Chargement du groupe...</span>
                </div>
              </>
            )}

            {step === "error" && (
              <>
                <div className="relative mb-7">
                  <div className="absolute inset-0 rounded-full bg-red-500/15 blur-2xl" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10 backdrop-blur-sm">
                    <AlertTriangle size={34} className="text-red-400" />
                  </div>
                </div>
                <h2 className="mb-2 text-2xl font-bold tracking-tight">Lien invalide</h2>
                <p className="mb-6 max-w-xs text-sm text-muted-foreground">{joinError}</p>
                <div className="flex w-full flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="auth-cta"
                  >
                    <RotateCcw size={16} />
                    Réessayer
                  </button>
                  {onBack && (
                    <button
                      type="button"
                      onClick={onBack}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card/40 py-3.5 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-card/70"
                    >
                      <ArrowLeft size={16} />
                      Retour
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </AuthShell>
      )}
    </AnimatePresence>
  );
}
