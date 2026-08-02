import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, RotateCcw, Clock3 } from "lucide-react";
import type { Member } from "../types";
import { useHaptic } from "../hooks/useHaptic";
import { AvatarImg } from "../components/AvatarImg";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { AuthShell, AUTH_ITEM_VARIANTS } from "../components/AuthShell";

export function IdentityScreen({ members, onSelect, onReset }: { members: Member[]; onSelect: (id: string) => void; onReset?: () => void }) {
  const haptic = useHaptic();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSelect = (id: string) => {
    haptic("medium");
    onSelect(id);
  };

  const active = members.filter((m) => m.status === "active");
  const pending = members.filter((m) => m.status === "pending");

  return (
    <AuthShell
      icon={Sparkles}
      title="Sélectionnez votre profil"
      subtitle="Choisissez qui vous êtes dans le groupe"
      footer={
        onReset ? (
          <motion.button
            type="button"
            variants={AUTH_ITEM_VARIANTS}
            onClick={() => {
              haptic("heavy");
              setShowResetConfirm(true);
            }}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
          >
            <RotateCcw size={14} />
            Réinitialiser le groupe
          </motion.button>
        ) : undefined
      }
    >
      <div className="grid grid-cols-2 gap-4">
        {active.map((member) => (
          <motion.button
            key={member.id}
            type="button"
            variants={AUTH_ITEM_VARIANTS}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleSelect(member.id)}
            className="glass-card-enhanced group flex flex-col items-center gap-3 rounded-3xl text-center"
            style={{ borderRadius: "1.5rem" }}
          >
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-primary/20 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/25 bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg shadow-primary/15">
                <AvatarImg avatar={member.avatar} size="text-4xl" />
              </div>
            </div>
            <span className="text-sm font-semibold leading-tight">{member.name}</span>
          </motion.button>
        ))}
        {pending.map((member) => (
          <div
            key={member.id}
            className="glass-card-enhanced flex flex-col items-center gap-3 rounded-3xl text-center opacity-60"
            style={{ borderRadius: "1.5rem" }}
          >
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-border bg-card/40">
              <AvatarImg avatar={member.avatar} size="text-4xl" />
            </div>
            <span className="text-sm font-semibold leading-tight">{member.name}</span>
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              <Clock3 size={10} />
              En attente
            </span>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => onReset?.()}
        title="Réinitialiser le groupe ?"
        description="Tous les membres, dépenses et paiements seront supprimés. Cette action est irréversible."
        confirmLabel="Réinitialiser"
        variant="danger"
        icon="reset"
      />
    </AuthShell>
  );
}
