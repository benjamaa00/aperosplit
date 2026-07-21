import { memo, useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Receipt, Send, CheckCircle2 } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { TabContentSkeleton } from "../components/SkeletonLoaders";
import { PaymentRequestCard } from "../components/PaymentRequestCard";
import type { Member, Expense, PendingPayment } from "../types";
import { formatCurrency, formatDate } from "../utils/currency";
import { calculateMemberBreakdown } from "../utils/debts";
import { AvatarImg } from "../components/AvatarImg";
import { InputPrompt } from "../components/InputPrompt";

export const HomeTab = memo(function HomeTab({
 currentMember,
 balance,
 totalSpent,
 expenseCount,
 recentExpenses,
 members,
 pendingPayments,
 completedPayments,
 onConfirmPayment,
 onRefusePayment,
 onResentPayment,
 onConfirmReceipt,
 onReportNotReceived,
 onMarkAsPaid,
 onCancelPaymentRequest,
 expenses,
 monthlyBudget,
 currency,
 onUpdateBudget,
}: {
 currentMember: Member;
 balance: number;
 totalSpent: number;
 expenseCount: number;
 recentExpenses: Expense[];
 members: Member[];
 pendingPayments: PendingPayment[];
 completedPayments: PendingPayment[];
 onConfirmPayment: (id: string) => void;
 onRefusePayment: (id: string, comment?: string) => void;
 onResentPayment: (id: string) => void;
 onConfirmReceipt: (id: string) => void;
 onReportNotReceived: (id: string, comment?: string) => void;
 onMarkAsPaid: (id: string) => void;
 onCancelPaymentRequest?: (id: string) => void;
 expenses: Expense[];
 monthlyBudget: number;
 currency: string;
 onUpdateBudget: (budget: number) => void;
}) {
 if (!currentMember) {
 return <TabContentSkeleton />;
 }

 const [showBudgetPrompt, setShowBudgetPrompt] = useState(false);
 const breakdown = useMemo(() => 
 calculateMemberBreakdown(currentMember.id, expenses, members),
 [currentMember.id, expenses, members]
 );

 // Calculate current month spending
 const currentMonthSpending = useMemo(() => {
 const now = new Date();
 const currentMonth = now.getMonth();
 const currentYear = now.getFullYear();
 
 return expenses
 .filter((e) => {
 const expenseDate = new Date(e.date);
 return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
 })
 .reduce((sum, e) => sum + e.amount, 0);
 }, [expenses]);

 const budgetPercentage = useMemo(() => {
 if (monthlyBudget === 0) return 0;
 return Math.min((currentMonthSpending / monthlyBudget) * 100, 100);
 }, [currentMonthSpending, monthlyBudget]);

 const budgetRemaining = monthlyBudget - currentMonthSpending;

 return (
 <>
 <div  className="max-w-md mx-auto px-5 pt-16 space-y-5">
 {/* Greeting */}
 <div>
 <p className="text-muted-foreground text-sm font-medium">Bonjour,</p>
 <h1 className="text-2xl font-bold tracking-tight">{currentMember.name} <AvatarImg avatar={currentMember.avatar} size="text-2xl" /></h1>
 </div>

 {/* Balance Card - Premium Glass */}
 <div
 
 
 
 className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl ${
 balance > 0
 ? "bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 shadow-emerald-500/30"
 : balance < 0
 ? "bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-red-500/30"
 : "bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-primary/30"
 }`}
 >
 <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-xl" />
 <div className="absolute bottom-0 left-0 w-32 h-32 bg-muted/30 rounded-full translate-y-10 -translate-x-10 blur-lg" />
 <div className="relative z-10">
 <p className="text-sm opacity-80 mb-1 font-medium">Votre solde</p>
 <p className="text-4xl font-bold tracking-tight">{formatCurrency(balance, currency)}</p>
 <div className="flex items-center gap-1.5 mt-3">
 {balance > 0 ? <TrendingUp size={14} /> : balance < 0 ? <TrendingDown size={14} /> : null}
 <p className="text-xs opacity-80">
 {balance > 0 ? "On vous doit de l'argent" : balance < 0 ? "Vous devez de l'argent" : "Tout est équilibré ✨"}
 </p>
 </div>
 <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-4">
 <div>
 <p className="text-[10px] opacity-70 uppercase tracking-wide">Vous avez payé</p>
 <p className="text-lg font-semibold">{formatCurrency(breakdown.totalPaid, currency)}</p>
 </div>
 <div>
 <p className="text-[10px] opacity-70 uppercase tracking-wide">Votre part</p>
 <p className="text-lg font-semibold">{formatCurrency(breakdown.totalShare, currency)}</p>
 </div>
 </div>
 </div>
 </div>

 {/* Monthly Budget Tracker */}
 <div
 
 
 
 className="glass-card-enhanced rounded-[1.25rem] p-4"
 >
 <div className="flex items-center justify-between mb-3">
 <div>
 <h3 className="text-sm font-semibold">Budget mensuel</h3>
 <p className="text-xs text-muted-foreground">
 {formatCurrency(currentMonthSpending, currency)} / {formatCurrency(monthlyBudget, currency)}
 </p>
 </div>
 <button
 onClick={() => setShowBudgetPrompt(true)}
 className="text-xs text-primary font-medium"
 >
 Modifier
 </button>
 </div>
 
 {/* Progress Bar */}
 <div className="h-3 bg-secondary rounded-full overflow-hidden mb-2">
 <div
 initial={{ width: 0 }}
 
 
 className={`h-full rounded-full ${
 budgetPercentage > 90 ? "bg-destructive" : budgetPercentage > 70 ? "bg-amber-500" : "bg-primary"
 }`}
 />
 </div>
 
 <div className="flex items-center justify-between text-xs">
 <span className="text-muted-foreground">
 {budgetRemaining >= 0 
 ? `${formatCurrency(budgetRemaining, currency)} restants` 
 : `${formatCurrency(Math.abs(budgetRemaining), currency)} dépassé`}
 </span>
 <span className={`font-medium ${
 budgetPercentage > 90 ? "text-destructive" : budgetPercentage > 70 ? "text-amber-500" : "text-primary"
 }`}>
 {budgetPercentage.toFixed(0)}%
 </span>
 </div>
 </div>

 {/* Detailed Breakdown */}
 {(breakdown.owesTo.length > 0 || breakdown.owedBy.length > 0) && (
 <div
 
 
 
 className="glass-card-enhanced rounded-[1.25rem] p-4"
 >
 <h3 className="text-sm font-semibold mb-3">Détail des comptes</h3>
 
 {breakdown.owesTo.length > 0 && (
 <div className="mb-4">
 <p className="text-xs text-muted-foreground mb-2 font-medium">Vous devez :</p>
 <div className="space-y-2">
 {breakdown.owesTo.slice(0, 3).map((debt, i) => {
 const to = members.find((m) => m.id === debt.to);
 return (
 <div key={i} className="flex items-center justify-between text-sm">
 <div className="flex items-center gap-2">
 <AvatarImg avatar={to?.avatar ?? ""} size="text-lg" />
 <div>
 <p className="font-medium">{to?.name}</p>
 <p className="text-xs text-muted-foreground">{debt.reason}</p>
 </div>
 </div>
 <p className="font-semibold text-destructive">{formatCurrency(debt.amount, currency)}</p>
 </div>
 );
 })}
 {breakdown.owesTo.length > 3 && (
 <p className="text-xs text-muted-foreground text-center pt-1">
 + {breakdown.owesTo.length - 3} autres dépenses
 </p>
 )}
 </div>
 </div>
 )}

 {breakdown.owedBy.length > 0 && (
 <div>
 <p className="text-xs text-muted-foreground mb-2 font-medium">On vous doit :</p>
 <div className="space-y-2">
 {breakdown.owedBy.slice(0, 3).map((debt, i) => {
 const from = members.find((m) => m.id === debt.from);
 return (
 <div key={i} className="flex items-center justify-between text-sm">
 <div className="flex items-center gap-2">
 <AvatarImg avatar={from?.avatar ?? ""} size="text-lg" />
 <div>
 <p className="font-medium">{from?.name}</p>
 <p className="text-xs text-muted-foreground">{debt.reason}</p>
 </div>
 </div>
 <p className="font-semibold text-emerald-400">{formatCurrency(debt.amount, currency)}</p>
 </div>
 );
 })}
 {breakdown.owedBy.length > 3 && (
 <p className="text-xs text-muted-foreground text-center pt-1">
 + {breakdown.owedBy.length - 3} autres dépenses
 </p>
 )}
 </div>
 </div>
 )}
 </div>
 )}

 {/* Stats Row */}
 <div className="grid grid-cols-2 gap-3">
 <div
 
 
 
 className="glass-card-enhanced rounded-[1.25rem] p-4"
 >
 <p className="text-[11px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">Total dépensé</p>
 <p className="text-xl font-bold">{formatCurrency(totalSpent, currency)}</p>
 </div>
 <div
 
 
 
 className="glass-card-enhanced rounded-[1.25rem] p-4"
 >
 <p className="text-[11px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">Dépenses</p>
 <p className="text-xl font-bold">{expenseCount}</p>
 </div>
 </div>

 {/* Pending Payments */}
 {pendingPayments.length > 0 ? (
 <div>
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-sm font-semibold flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
 Remboursements en attente
 </h3>
 <span className="text-[11px] text-muted-foreground font-medium bg-muted/30 px-2.5 py-0.5 rounded-full">{pendingPayments.length}</span>
 </div>
 <div className="space-y-3">
 {pendingPayments.map((p) => (
 <PaymentRequestCard
 key={p.id}
 payment={p}
 members={members}
 currentMemberId={currentMember.id}
 currency={currency}
 onConfirmPayment={onConfirmPayment}
 onRefusePayment={onRefusePayment}
 onResentPayment={onResentPayment}
 onConfirmReceipt={onConfirmReceipt}
 onReportNotReceived={onReportNotReceived}
 onMarkAsPaid={onMarkAsPaid}
 cancelPaymentRequest={onCancelPaymentRequest}
 />
 ))}
 </div>
 </div>
 ) : (
 <EmptyState
 icon={Send}
 title="Aucun remboursement en cours"
 description="Les demandes de remboursement apparaitront ici."
 />
 )}

 {/* Completed Payments History */}
 {completedPayments.length > 0 ? (
 <div>
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-sm font-semibold flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-emerald-400" />
 Remboursements confirmés
 </h3>
 <span className="text-[11px] text-muted-foreground font-medium bg-muted/30 px-2.5 py-0.5 rounded-full">{completedPayments.length}</span>
 </div>
 <div className="space-y-2">
 {completedPayments.slice(0, 5).map((p, i) => {
 const from = members.find((m) => m.id === p.fromId);
 const to = members.find((m) => m.id === p.toId);
 
 return (
 <div
 key={p.id}
 
 
 
 className="glass-card-enhanced rounded-[1.25rem] p-3.5 flex items-center gap-3"
 >
 <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center flex-shrink-0">
 <CheckCircle2 size={18} className="text-emerald-500" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-1.5">
 <AvatarImg avatar={from?.avatar ?? ""} size="text-sm" />
 <span className="text-[11px] text-muted-foreground">→</span>
 <AvatarImg avatar={to?.avatar ?? ""} size="text-sm" />
 </div>
 <p className="text-xs text-muted-foreground mt-0.5 truncate">
 {from?.name} → {to?.name}
 {p.respondedAt && ` · ${formatDate(p.respondedAt)}`}
 </p>
 </div>
 <p className="text-sm font-bold text-emerald-400 flex-shrink-0">{formatCurrency(p.amount, currency)}</p>
 </div>
 );
 })}
 {completedPayments.length > 5 && (
 <p className="text-xs text-muted-foreground text-center pt-2">
 + {completedPayments.length - 5} autres remboursements
 </p>
 )}
 </div>
 </div>
 ) : (
 <EmptyState
 icon={CheckCircle2}
 title="Aucun remboursement"
 description="L'historique des remboursements confirmés apparaitra ici."
 />
 )}

 {/* Recent Activity */}
 <div>
 <h3 className="text-sm font-semibold mb-3">Activité récente</h3>
 <div className="space-y-2">
 {recentExpenses.length === 0 ? (
 <EmptyState
 icon={Receipt}
 title="Pas encore de depenses"
 description="Les dernieres depenses du groupe apparaîtront ici."
 action={{ label: "Ajouter une depense", onClick: () => {} }}
 />
 ) : (
 recentExpenses.map((exp, i) => {
 const payer = members.find((m) => m.id === exp.payerId);
 return (
 <div
 key={exp.id}
 
 
 
 className="glass-card-enhanced hover:bg-card/60 transition-colors duration-200 rounded-[1.25rem] p-4 flex items-center gap-3"
 >
 <div className="w-11 h-11 rounded-2xl bg-secondary/50 flex items-center justify-center text-lg">
 {exp.categoryEmoji}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium truncate">{exp.description}</p>
 <p className="text-xs text-muted-foreground">{payer?.name} • {formatDate(exp.date)}</p>
 </div>
 <p className="text-sm font-bold">{formatCurrency(exp.amount, currency)}</p>
 </div>
 );
 })
 )}
 </div>
 </div>
 </div>

 <InputPrompt
 open={showBudgetPrompt}
 onClose={() => setShowBudgetPrompt(false)}
 onConfirm={(val) => {
 const num = parseFloat(val);
 if (!isNaN(num) && num > 0) onUpdateBudget(num);
 }}
 title="Budget mensuel"
 description="Entrez votre budget mensuel"
 defaultValue={monthlyBudget.toString()}
 confirmLabel="Enregistrer"
 type="number"
 />

 <div className="h-8" />
 </>
 );
});
HomeTab.displayName = "HomeTab";
