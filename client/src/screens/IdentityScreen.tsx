import { useState } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import type { Member } from "../types";
import { useHaptic } from "../hooks/useHaptic";
import { AvatarImg } from "../components/AvatarImg";
import { ConfirmDialog } from "../components/ConfirmDialog";

export function IdentityScreen({ members, onSelect, onReset }: { members: Member[]; onSelect: (id: string) => void; onReset?: () => void }) {
 const haptic = useHaptic();
 const [showResetConfirm, setShowResetConfirm] = useState(false);

 const handleSelect = (id: string) => {
 haptic("medium");
 onSelect(id);
 };

 return (
 <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
 <div className="absolute inset-0 overflow-hidden pointer-events-none">
 <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/[0.07] rounded-full blur-3xl" />
 <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-primary/[0.04] rounded-full blur-3xl" />
 </div>

 <div  className="text-center mb-12 relative z-10">
 <div
 className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10"
 >
 <Sparkles size={28} className="text-primary" />
 </div>
 <h1 className="text-3xl font-bold tracking-tight mb-2">Équilibra</h1>
 <p className="text-muted-foreground text-sm">Sélectionnez votre profil</p>
 </div>

 <div className="grid grid-cols-2 gap-4 w-full max-w-xs relative z-10">
 {members.filter(m => m.status === "active").map((member, i) => (
 <button
 key={member.id}
 onClick={() => handleSelect(member.id)}
 className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-card/50 border border-border hover:border-primary/30 hover:bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 press-scale backdrop-blur-sm"
 >
 <span 
 className="text-4xl"
 
 >
 <AvatarImg avatar={member.avatar} size="text-4xl" />
 </span>
 <span className="text-sm font-semibold">{member.name}</span>
 </button>
 ))}
 {members.filter(m => m.status === "pending").map((member, i) => (
 <div
 key={member.id}
 className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-card/50 border border-border opacity-50 cursor-not-allowed"
 >
 <AvatarImg avatar={member.avatar} size="text-4xl" />
 <span className="text-sm font-semibold">{member.name}</span>
 <span className="text-[10px] text-muted-foreground">En attente d'approbation</span>
 </div>
 ))}
 </div>

 {onReset && (
 <button
 onClick={() => {
 haptic("heavy");
 setShowResetConfirm(true);
 }}
 className="mt-8 flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors relative z-10"
 >
 <RotateCcw size={14} />
 Réinitialiser le groupe
 </button>
 )}

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
 </div>
 );
}
