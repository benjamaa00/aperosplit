import { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, ArrowUpRight, X, Sparkles, Send, MessageSquare, Scale } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import type { Member, Expense } from "../types";
import { formatCurrency } from "../utils/currency";
import { calculateMemberBreakdown } from "../utils/debts";
import { fadeUp } from "../constants";
import { AvatarImg } from "../components/AvatarImg";

interface RequestSheetProps {
  member: Member;
  amount: number;
  currency: string;
  onClose: () => void;
  onConfirm: (note: string) => void;
}

function RequestSheet({ member, amount, currency, onClose, onConfirm }: RequestSheetProps) {
  const [note, setNote] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md bg-card rounded-t-[1.5rem] max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mt-3" />
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight">Demander un paiement</h3>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </motion.button>
          </div>

          <div className="flex items-center gap-4 bg-muted/30 rounded-2xl p-4">
            <AvatarImg avatar={member.avatar} size="text-4xl" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{member.name}</p>
              <p className="text-2xl font-bold tabular-nums text-primary">
                {formatCurrency(amount, currency)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <MessageSquare size={12} />
              Note (optionnel)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Remboursement pour le dîner..."
              rows={3}
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onConfirm(note)}
            className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm hover:bg-primary/90 transition-colors"
          >
            <Send size={15} />
            Envoyer la demande
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export const BalancesTab = memo(function BalancesTab({
  members,
  balances,
  suggestedTransactions,
  currentMemberId,
  onRequestPayment,
  expenses,
  currency,
}: {
  members: Member[];
  balances: Record<string, number>;
  suggestedTransactions: Array<{ from: string; to: string; amount: number; explanation: string }>;
  currentMemberId: string;
  onRequestPayment: (toId: string, amount: number, note?: string) => void;
  expenses: Expense[];
  currency: string;
}) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [requestSheet, setRequestSheet] = useState<{
    member: Member;
    amount: number;
  } | null>(null);

  const selectedBreakdown = useMemo(
    () =>
      selectedMember
        ? calculateMemberBreakdown(selectedMember, expenses, members)
        : null,
    [selectedMember, expenses, members]
  );

  const currentMemberBalance = balances[currentMemberId] ?? 0;

  return (
    <motion.div
      {...fadeUp}
      className="max-w-md mx-auto px-5 pt-16 space-y-5"
    >
      <h1 className="text-2xl font-bold tracking-tight">Soldes</h1>

      <div className="space-y-2">
        {members.map((member, i) => {
          const memberBalance = balances[member.id] ?? 0;
          const isPositive = memberBalance > 0.01;
          const isNegative = memberBalance < -0.01;
          const isCurrentMember = member.id === currentMemberId;
          const showDemandButton =
            isNegative && !isCurrentMember && currentMemberBalance > 0.01;

          return (
            <div key={member.id}>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 30 }}
                onClick={() =>
                  setSelectedMember(selectedMember === member.id ? null : member.id)
                }
                className={`w-full glass-card-enhanced rounded-[1.25rem] p-4 flex items-center gap-3 transition-all ${
                  selectedMember === member.id
                    ? "border-primary/30 bg-card/70"
                    : "hover:border-primary/20"
                }`}
              >
                <AvatarImg avatar={member.avatar} size="text-[2.5rem]" />
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{member.name}</p>
                    {member.role === "admin" && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs font-medium ${
                      isPositive
                        ? "text-emerald-400"
                        : isNegative
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {isPositive ? "Créancier" : isNegative ? "Débiteur" : "Équilibré"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-lg font-bold tabular-nums ${
                      isPositive
                        ? "text-emerald-400"
                        : isNegative
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {formatCurrency(memberBalance, currency)}
                  </p>
                  {showDemandButton && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRequestSheet({
                          member,
                          amount: Math.abs(memberBalance),
                        });
                      }}
                      className="bg-primary text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Demander
                    </motion.button>
                  )}
                  {selectedMember === member.id ? (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronRight size={16} className="text-muted-foreground" />
                  )}
                </div>
              </motion.button>

              <AnimatePresence>
                {selectedMember === member.id && selectedBreakdown && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <div className="glass-card-enhanced rounded-[1.25rem] p-4 mt-2 space-y-5 border border-border">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">
                          Détail pour {member.name}
                        </h3>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSelectedMember(null)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X size={16} />
                        </motion.button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-background/50 rounded-xl p-3 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                            A payé
                          </p>
                          <p className="text-lg font-bold tabular-nums">
                            {formatCurrency(selectedBreakdown.totalPaid, currency)}
                          </p>
                        </div>
                        <div className="bg-background/50 rounded-xl p-3 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                            Sa part
                          </p>
                          <p className="text-lg font-bold tabular-nums">
                            {formatCurrency(selectedBreakdown.totalShare, currency)}
                          </p>
                        </div>
                      </div>

                      {selectedBreakdown.owesTo.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 font-medium">
                            Doit à :
                          </p>
                          <div className="space-y-2">
                            {selectedBreakdown.owesTo.slice(0, 5).map((debt, idx) => {
                              const to = members.find((m) => m.id === debt.to);
                              const canDemand = debt.to === currentMemberId;
                              if (!to) return null;
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-sm bg-background/30 rounded-xl p-3 hover:bg-card/50 transition-colors duration-200"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <AvatarImg avatar={to.avatar} size="text-base" />
                                    <div className="min-w-0">
                                      <p className="font-medium truncate">{to.name}</p>
                                      <p className="text-[10px] text-muted-foreground truncate">
                                        {debt.reason}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2">
                                    <p className="font-semibold text-destructive tabular-nums text-sm">
                                      {formatCurrency(debt.amount, currency)}
                                    </p>
                                    {canDemand && (
                                      <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                          setRequestSheet({
                                            member: to,
                                            amount: debt.amount,
                                          });
                                        }}
                                        className="bg-primary text-primary-foreground px-3 py-1 rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors"
                                      >
                                        Demander
                                      </motion.button>
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
                          <p className="text-xs text-muted-foreground mb-2 font-medium">
                            Est dû par :
                          </p>
                          <div className="space-y-2">
                            {selectedBreakdown.owedBy.slice(0, 5).map((debt, idx) => {
                              const from = members.find((m) => m.id === debt.from);
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-sm bg-background/30 rounded-xl p-3 hover:bg-card/50 transition-colors duration-200"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <AvatarImg avatar={from?.avatar ?? ""} size="text-base" />
                                    <div className="min-w-0">
                                      <p className="font-medium truncate">{from?.name}</p>
                                      <p className="text-[10px] text-muted-foreground truncate">
                                        {debt.reason}
                                      </p>
                                    </div>
                                  </div>
                                    <p className="font-semibold text-emerald-400 tabular-nums text-sm ml-2">
                                      {formatCurrency(debt.amount, currency)}
                                  </p>
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {suggestedTransactions.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            Remboursements optimisés
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Ces paiements minimisent le nombre de transactions pour équilibrer
            les comptes
          </p>
          <div className="space-y-2">
                    {suggestedTransactions.map((t, i) => {
              const from = members.find((m) => m.id === t.from);
              const to = members.find((m) => m.id === t.to);
              const isForMe = t.to === currentMemberId;
              if (!from || !to) return null;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  className="glass-card-enhanced rounded-[1.25rem] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AvatarImg avatar={from.avatar} size="text-xl" />
                      <ArrowUpRight size={16} className="text-primary" />
                      <AvatarImg avatar={to.avatar} size="text-xl" />
                    </div>
                    <p className="text-base font-bold tabular-nums">
                      {formatCurrency(t.amount, currency)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {from.name} doit {formatCurrency(t.amount, currency)} à {to.name}
                  </p>
                  {isForMe && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setRequestSheet({
                          member: from,
                          amount: t.amount,
                        });
                      }}
                      className="mt-3 w-full bg-primary/10 text-primary text-xs font-semibold py-2.5 rounded-xl border border-primary/20"
                    >
                      Demander le remboursement
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Scale}
          title="Tout est equilibre"
          description="Aucune dette en cours. Profitez de votre temps ensemble !"
        />
      )}

      <AnimatePresence>
        {requestSheet && (
          <RequestSheet
            member={requestSheet.member}
            amount={requestSheet.amount}
            currency={currency}
            onClose={() => setRequestSheet(null)}
            onConfirm={(note) => {
              onRequestPayment(requestSheet.member.id, requestSheet.amount, note || undefined);
              setRequestSheet(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});
BalancesTab.displayName = "BalancesTab";
