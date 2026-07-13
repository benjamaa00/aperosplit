import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Member } from "../types";
import { fadeUp, spring } from "../constants";
import { useHaptic } from "../hooks/useHaptic";

export function IdentityScreen({ members, onSelect }: { members: Member[]; onSelect: (id: string) => void }) {
  const haptic = useHaptic();

  const handleSelect = (id: string) => {
    haptic("medium");
    onSelect(id);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
        />
      </div>

      <motion.div {...fadeUp} className="text-center mb-12 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, ...spring }}
          className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10"
        >
          <Sparkles size={28} className="text-primary" />
        </motion.div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Équilibra</h1>
        <p className="text-muted-foreground text-sm">Sélectionnez votre profil</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xs relative z-10">
        {members.map((member, i) => (
          <motion.button
            key={member.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08, ...spring }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleSelect(member.id)}
            className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-card/50 border border-border hover:border-primary/30 hover:bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 press-scale backdrop-blur-sm"
          >
            <motion.span 
              className="text-4xl"
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              {member.avatar}
            </motion.span>
            <span className="text-sm font-semibold">{member.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
