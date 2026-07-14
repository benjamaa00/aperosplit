import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowUpRight, X, Sparkles } from "lucide-react";
import type { Member, Expense } from "../types";
import { formatCurrency } from "../utils/currency";
import { calculateMemberBreakdown } from "../utils/debts";
import { fadeUp } from "../constants";
import { AvatarImg } from "../components/AvatarImg";

export function BalancesTab({
  members,
  balances,
  suggestedTransactions,
  currentMemberId,
  onRequestPayment,
  expenses,
}: {
  members: Member[];
  balances: Record<string, number>;
  suggestedTransactions: Array<{ from: string; to: string; amount: number; explanation: string }>;
  currentMemberId: string;
  onRequestPayment: (toId: string, amount: number) => void;
  expenses: Expense[];
}) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  
  const selectedBreakdown = useMemo(() => 
    selectedMember ? calculateMemberBreakdown(selectedMember, expenses, members) : null,
    [selectedMember, expenses, members]
  );

  return (
    <motion.div {...fadeUp} className="max-w-md mx-auto px-5 pt-16 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Soldes</h1>

      {/* Member Balances */}
      <div className="space-y-2">
        {members.map((member, i) => {
          const memberBalance = balances[member.id];
          const currentMemberBalance = balances[currentMemberId];
          // Only show "Demander" button if current member is creditor and this member owes money
          const memberOwesMoney = memberBalance < -0.01 && member.id !== currentMemberId && currentMemberBalance > 0.01;
          
          return (
            <motion.button
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
              className={`w-full bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 flex items-center gap-3 transition-all ${
                selectedMember === member.id ? 'border-primary/30 bg-card/70' : 'hover:border-primary/20'
              }`}
            >
              <AvatarImg avatar={member.avatar} size="text-3xl" />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">{member.name}</p>
                <p className="text-xs text-muted-foreground">
                  {memberBalance > 0.01 ? "Créancier" : memberBalance < -0.01 ? "Débiteur" : "Équilibré"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className={`text-lg font-bold ${
                  memberBalance > 0.01 ? "text-green-400" : memberBalance < -0.01 ? "text-red-400" : "text-muted-foreground"
                }`}>
                  {memberBalance > 0 ? "+" : ""}{formatCurrency(memberBalance)}
                </p>
                {memberOwesMoney && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestPayment(member.id, Math.abs(memberBalance));
                    }}
                    className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    Demander
                  </button>
                )}
                <ChevronRight 
                  size={16} 
                  className={`text-muted-foreground transition-transform ${
                    selectedMember === member.id ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Detailed Member Breakdown */}
      <AnimatePresence>
        {selectedMember && selectedBreakdown && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Détail pour {members.find(m => m.id === selectedMember)?.name}</h3>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">A payé</p>
                <p className="text-lg font-bold">{formatCurrency(selectedBreakdown.totalPaid)}</p>
              </div>
              <div className="bg-background/50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sa part</p>
                <p className="text-lg font-bold">{formatCurrency(selectedBreakdown.totalShare)}</p>
              </div>
            </div>

            {selectedBreakdown.owesTo.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Doit à :</p>
                <div className="space-y-2">
                  {selectedBreakdown.owesTo.slice(0, 5).map((debt, i) => {
                    const to = members.find((m) => m.id === debt.to);
                    return (
                      <div key={i} className="flex items-center justify-between text-sm bg-background/30 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <AvatarImg avatar={to?.avatar ?? ""} size="text-base" />
                          <div>
                            <p className="font-medium">{to?.name}</p>
                            <p className="text-[10px] text-muted-foreground">{debt.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-red-400">{formatCurrency(debt.amount)}</p>
                          {debt.to === currentMemberId && (
                            <button
                              onClick={() => onRequestPayment(debt.to, debt.amount)}
                              className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                            >
                              Demander
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {selectedBreakdown.owesTo.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      + {selectedBreakdown.owesTo.length - 5} autres
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedBreakdown.owedBy.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Est dû par :</p>
                <div className="space-y-2">
                  {selectedBreakdown.owedBy.slice(0, 5).map((debt, i) => {
                    const from = members.find((m) => m.id === debt.from);
                    return (
                      <div key={i} className="flex items-center justify-between text-sm bg-background/30 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <AvatarImg avatar={from?.avatar ?? ""} size="text-base" />
                          <div>
                            <p className="font-medium">{from?.name}</p>
                            <p className="text-[10px] text-muted-foreground">{debt.reason}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-green-400">{formatCurrency(debt.amount)}</p>
                      </div>
                    );
                  })}
                  {selectedBreakdown.owedBy.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      + {selectedBreakdown.owedBy.length - 5} autres
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggested Transactions */}
      {suggestedTransactions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            Remboursements optimisés
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Ces paiements minimisent le nombre de transactions pour équilibrer les comptes
          </p>
          <div className="space-y-2">
            {suggestedTransactions.map((t, i) => {
              const from = members.find((m) => m.id === t.from);
              const to = members.find((m) => m.id === t.to);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AvatarImg avatar={from?.avatar ?? ""} size="text-xl" />
                      <ArrowUpRight size={16} className="text-primary" />
                      <AvatarImg avatar={to?.avatar ?? ""} size="text-xl" />
                    </div>
                    <p className="text-base font-bold">{formatCurrency(t.amount)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {from?.name} doit {formatCurrency(t.amount)} à {to?.name}
                  </p>
                  {t.to === currentMemberId && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onRequestPayment(t.from, t.amount)}
                      className="mt-3 w-full bg-primary/10 text-primary text-xs font-semibold py-2.5 rounded-xl border border-primary/20 press-scale"
                    >
                      Demander le remboursement
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
