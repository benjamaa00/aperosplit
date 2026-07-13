import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import type { Member, Expense } from "../types";
import { formatCurrency, formatDate } from "../utils/currency";
import { fadeUp } from "../constants";

export function ExpensesTab({
  expenses,
  members,
  currentMemberId,
  onDelete,
  onAdd,
  onRequestPayment,
  onRequestGroupPayment,
}: {
  expenses: Expense[];
  members: Member[];
  currentMemberId: string;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onRequestPayment: (toId: string, amount: number, expenseId: string) => void;
  onRequestGroupPayment: (expenseId: string, participantIds?: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = expenses
    .filter((e) => e.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date - a.date);

  return (
    <motion.div {...fadeUp} className="max-w-md mx-auto px-5 pt-16 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dépenses</h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onAdd}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30"
        >
          <Plus size={20} />
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher une dépense..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-card/50 backdrop-blur-sm border border-border rounded-2xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20 transition-all"
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <div className="text-4xl mb-3">🔍</div>
            Aucune dépense trouvée
          </div>
        ) : (
          filtered.map((exp, i) => {
            const payer = members.find((m) => m.id === exp.payerId);
            const perPerson = exp.amount / exp.participants.length;
            const userShare = exp.participants.includes(currentMemberId) ? perPerson : 0;
            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-secondary/50 flex items-center justify-center text-xl">
                    {exp.categoryEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{exp.description}</p>
                    <p className="text-xs text-muted-foreground">{payer?.name} • {formatDate(exp.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(exp.amount)}</p>
                    <p className="text-[10px] text-muted-foreground">{exp.participants.length} pers.</p>
                  </div>
                </div>
                
                {/* Expense breakdown */}
                <div className="bg-background/30 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Payé par {payer?.name}</span>
                    <span className="font-semibold">{formatCurrency(exp.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Part par personne</span>
                    <span className="font-semibold">{formatCurrency(perPerson)}</span>
                  </div>
                  {exp.participants.includes(currentMemberId) && (
                    <div className="flex items-center justify-between text-xs bg-primary/10 rounded-lg p-2 -mx-2">
                      <span className="text-primary font-medium">Votre part</span>
                      <span className="font-bold text-primary">{formatCurrency(userShare)}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {exp.participants.map((pid) => {
                      const participant = members.find((m) => m.id === pid);
                      return (
                        <span key={pid} className="text-xs bg-background/50 px-2 py-1 rounded-full flex items-center gap-1">
                          <span className="text-sm">{participant?.avatar}</span>
                          {participant?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    {exp.payerId === currentMemberId && (
                      <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-1 rounded-full">Vous avez payé</span>
                    )}
                    {exp.participants.includes(currentMemberId) && exp.payerId !== currentMemberId && (
                      <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full">Vous devez {formatCurrency(userShare)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {exp.payerId === currentMemberId && exp.participants.length > 1 && (
                      <>
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => onRequestGroupPayment(exp.id)}
                          className="text-[10px] bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-medium hover:bg-primary/90 transition-colors"
                        >
                          Demander à tous
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => {
                            const otherParticipant = exp.participants.find(p => p !== currentMemberId);
                            if (otherParticipant) {
                              onRequestPayment(otherParticipant, perPerson, exp.id);
                            }
                          }}
                          className="text-[10px] bg-primary/50 text-primary-foreground px-3 py-1.5 rounded-full font-medium hover:bg-primary/70 transition-colors"
                        >
                          Demander individuel
                        </motion.button>
                      </>
                    )}
                    {exp.payerId === currentMemberId && exp.participants.length === 1 && (
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => {
                          const otherParticipant = exp.participants.find(p => p !== currentMemberId);
                          if (otherParticipant) {
                            onRequestPayment(otherParticipant, perPerson, exp.id);
                          }
                        }}
                        className="text-[10px] bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-medium hover:bg-primary/90 transition-colors"
                      >
                        Demander remboursement
                      </motion.button>
                    )}
                    {exp.payerId === currentMemberId && (
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => onDelete(exp.id)}
                        className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/10"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
