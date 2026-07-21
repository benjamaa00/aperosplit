import { useState, useMemo } from "react";
import { X, Clock, Search, ArrowUpRight, ArrowDownLeft, Check, AlertTriangle, RefreshCw, Send, Inbox, Receipt, CheckCircle, Ban } from "lucide-react";
import { AvatarImg } from "./AvatarImg";
import { formatCurrency } from "../utils/currency";
import { getStatusDot, getStatusPill, getStatusLabel } from "../utils/statusColors";

function getStatusIcon(status: string): React.ReactNode {
 switch (status) {
 case "pending": return <Clock size={11} />;
 case "late": return <RefreshCw size={11} />;
 case "accepted":
 case "completed":
 case "paid": return <Check size={11} />;
 case "refused": return <X size={11} />;
 case "disputed": return <AlertTriangle size={11} />;
 case "resent": return <Send size={11} />;
 default: return <Clock size={11} />;
 }
}

interface PaymentHistoryPayment {
 id: string;
 fromId: string;
 fromName: string;
 toId: string;
 toName: string;
 amount: number;
 status: "pending" | "accepted" | "refused" | "completed" | "late" | "disputed" | "paid" | "in_progress" | "resent";
 createdAt?: number;
 completedAt?: number;
 respondedAt?: number;
 paidAt?: number;
 confirmedAt?: number;
 comment?: string;
 requestNote?: string;
 expenseId?: string;
 attemptCount?: number;
 notificationCount?: number;
 isGroupRequest?: boolean;
}

interface PaymentHistoryProps {
 payments: PaymentHistoryPayment[];
 expenses: Array<{ id: string; description: string; amount: number; payerId: string; date: number; category: string; categoryEmoji: string }>;
 members: Array<{ id: string; name: string; avatar: string }>;
 currentMemberId: string;
 currency: string;
 onConfirmPayment?: (id: string) => void;
 onRefusePayment?: (id: string) => void;
 onResentPayment?: (id: string) => void;
 onConfirmReceipt?: (id: string) => void;
 onReportNotReceived?: (id: string, comment?: string) => void;
 onMarkAsPaid?: (id: string) => void;
 onCancelPayment?: (id: string) => void;
}

type FilterTab = "all" | "pending" | "completed" | "refused" | "sent" | "received";

function relativeTime(ts: number): string {
 const diff = Date.now() - ts;
 const mins = Math.floor(diff / 60000);
 if (mins < 1) return "À l'instant";
 if (mins < 60) return `Il y a ${mins} min`;
 const hours = Math.floor(mins / 60);
 if (hours < 24) return `Il y a ${hours}h`;
 const days = Math.floor(hours / 24);
 if (days < 7) return `Il y a ${days}j`;
 return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function PaymentHistory({
 payments, expenses, members, currentMemberId, currency,
 onConfirmPayment, onRefusePayment, onResentPayment,
 onConfirmReceipt, onReportNotReceived, onMarkAsPaid, onCancelPayment,
}: PaymentHistoryProps) {
 const [activeTab, setActiveTab] = useState<FilterTab>("all");
 const [search, setSearch] = useState("");

 const getMember = (id: string) => members.find(m => m.id === id);
 const getExpense = (id?: string) => id ? expenses.find(e => e.id === id) : undefined;

 const totalReceived = useMemo(
 () => payments.filter(p => p.toId === currentMemberId && (p.status === "completed" || p.status === "paid")).reduce((s, p) => s + p.amount, 0),
 [payments, currentMemberId]
 );

 const totalSent = useMemo(
 () => payments.filter(p => p.fromId === currentMemberId && (p.status === "completed" || p.status === "paid")).reduce((s, p) => s + p.amount, 0),
 [payments, currentMemberId]
 );

 const totalPending = useMemo(
 () => payments.filter(p => (p.toId === currentMemberId || p.fromId === currentMemberId) && (p.status === "pending" || p.status === "late" || p.status === "accepted")).reduce((s, p) => s + p.amount, 0),
 [payments, currentMemberId]
 );

 const filteredPayments = useMemo(() => {
 return payments.filter(p => {
 switch (activeTab) {
 case "pending":
 if (p.status !== "pending" && p.status !== "late" && p.status !== "accepted") return false;
 break;
 case "completed":
 if (p.status !== "completed" && p.status !== "paid") return false;
 break;
 case "refused":
 if (p.status !== "refused" && p.status !== "disputed") return false;
 break;
 case "sent":
 if (p.fromId !== currentMemberId) return false;
 break;
 case "received":
 if (p.toId !== currentMemberId) return false;
 break;
 }
 if (search) {
 const q = search.toLowerCase();
 return (p.fromName || "").toLowerCase().includes(q) || (p.toName || "").toLowerCase().includes(q);
 }
 return true;
 });
 }, [payments, activeTab, search, currentMemberId]);

 const grouped = useMemo(() => {
 const now = new Date();
 const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
 const yesterday = today - 86400_000;
 const weekAgo = today - 7 * 86400_000;
 const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();

 const order = ["Aujourd'hui", "Hier", "Cette semaine", "Ce mois", "Plus ancien"];
 const groups: Record<string, PaymentHistoryPayment[]> = {};

 const sorted = [...filteredPayments].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

 sorted.forEach(p => {
 const ts = p.createdAt || 0;
 let key: string;
 if (ts >= today) key = "Aujourd'hui";
 else if (ts >= yesterday) key = "Hier";
 else if (ts >= weekAgo) key = "Cette semaine";
 else if (ts >= monthAgo) key = "Ce mois";
 else key = "Plus ancien";
 if (!groups[key]) groups[key] = [];
 groups[key].push(p);
 });

 return order.filter(k => groups[k]?.length).map(k => [k, groups[k]] as const);
 }, [filteredPayments]);

 const tabs: { key: FilterTab; label: string }[] = [
 { key: "all", label: "Tout" },
 { key: "pending", label: "En attente" },
 { key: "completed", label: "Complétés" },
 { key: "refused", label: "Refusés" },
 { key: "sent", label: "Envoyés" },
 { key: "received", label: "Reçus" },
 ];

 return (
 <div className="max-w-md mx-auto px-5 pt-12 space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold tracking-tight">Historique</h1>
 <p className="text-sm text-muted-foreground mt-1">{filteredPayments.length} requête{filteredPayments.length !== 1 ? "s" : ""}</p>
 </div>
 </div>

 <div className="grid grid-cols-3 gap-2">
 <div className="bg-card/50 rounded-2xl p-3 text-center">
 <div className="flex items-center justify-center mb-1">
 <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
 <ArrowDownLeft size={14} className="text-emerald-400" />
 </div>
 </div>
 <p className="text-sm font-bold tabular-nums text-emerald-400">{formatCurrency(totalReceived, currency)}</p>
 <p className="text-[10px] text-muted-foreground">Reçu</p>
 </div>
 <div className="bg-card/50 rounded-2xl p-3 text-center">
 <div className="flex items-center justify-center mb-1">
 <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center">
 <ArrowUpRight size={14} className="text-amber-400" />
 </div>
 </div>
 <p className="text-sm font-bold tabular-nums text-amber-400">{formatCurrency(totalSent, currency)}</p>
 <p className="text-[10px] text-muted-foreground">Envoyé</p>
 </div>
 <div className="bg-card/50 rounded-2xl p-3 text-center">
 <div className="flex items-center justify-center mb-1">
 <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center">
 <Clock size={14} className="text-amber-400" />
 </div>
 </div>
 <p className="text-sm font-bold tabular-nums text-amber-400">{formatCurrency(totalPending, currency)}</p>
 <p className="text-[10px] text-muted-foreground">En attente</p>
 </div>
 </div>

 <div className="relative">
 <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <input
 type="text"
 placeholder="Rechercher..."
 value={search}
 onChange={e => setSearch(e.target.value)}
 className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
 />
 {search && (
 <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
 <X size={14} />
 </button>
 )}
 </div>

 <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
 {tabs.map(tab => (
 <button
 key={tab.key}
 onClick={() => setActiveTab(tab.key)}
 className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap shrink-0 ${
 activeTab === tab.key
 ? "bg-primary text-primary-foreground"
 : "bg-card/50 text-muted-foreground border border-border"
 }`}
 >
 {tab.label}
 </button>
 ))}
 </div>

 {grouped.length === 0 ? (
 <div className="text-center py-16">
 <div className="mb-4 flex justify-center"><Inbox size={40} className="text-muted-foreground/30" /></div>
 <p className="text-muted-foreground text-sm font-medium">Aucune activité</p>
 </div>
 ) : (
 <div className="space-y-5">
 {grouped.map(([groupLabel, items]) => (
 <div key={groupLabel}>
 <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">{groupLabel}</p>
 <div className="space-y-2">
 {items.map((p, idx) => {
 const from = getMember(p.fromId);
 const to = getMember(p.toId);
 const expense = getExpense(p.expenseId);
 const isFromCurrentUser = p.fromId === currentMemberId;
 const isToCurrentUser = p.toId === currentMemberId;
 const isPending = p.status === "pending" || p.status === "late";
 const attempts = p.attemptCount || 0;
 const canRemind = isPending && isFromCurrentUser && attempts < 3;

 return (
 <div
 key={p.id}
 
 
 
 className="glass-card-enhanced rounded-[1.25rem] p-3.5 hover:bg-card/60 transition-colors duration-200"
 >
 <div className="flex items-center gap-3">
 <div className={`w-1 h-10 rounded-full shrink-0 ${getStatusDot(p.status)}`} />

 <div className="flex items-center gap-2 shrink-0">
 {from?.avatar ? (
 <AvatarImg avatar={from.avatar} size="w-9 h-9 text-xs" />
 ) : (
 <div className="w-9 h-9 rounded-full bg-muted/40 flex items-center justify-center text-[11px] font-semibold text-muted-foreground">
 {(p.fromName || "?").charAt(0)}
 </div>
 )}
 <ArrowUpRight size={12} className="text-muted-foreground/50" />
 {to?.avatar ? (
 <AvatarImg avatar={to.avatar} size="w-9 h-9 text-xs" />
 ) : (
 <div className="w-9 h-9 rounded-full bg-muted/40 flex items-center justify-center text-[11px] font-semibold text-muted-foreground">
 {(p.toName || "?").charAt(0)}
 </div>
 )}
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <p className="text-sm font-medium truncate">{p.fromName}</p>
 <span className="text-muted-foreground/40 text-[11px]">→</span>
 <p className="text-sm font-medium truncate">{p.toName}</p>
 </div>
 <div className="flex items-center gap-2 mt-1">
 <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${getStatusPill(p.status)}`}>
 {getStatusIcon(p.status)}
 {getStatusLabel(p.status)}
 </span>
 <span className="text-[10px] text-muted-foreground">{relativeTime(p.createdAt || Date.now())}</span>
 </div>
 {expense && (
 <div className="flex items-center gap-1 mt-1">
 <Receipt size={10} className="text-muted-foreground/50" />
 <p className="text-[10px] text-muted-foreground/60 truncate">{expense.description} ({formatCurrency(expense.amount, currency)})</p>
 </div>
 )}
 {p.requestNote && (
 <p className="text-[11px] text-muted-foreground/60 mt-1 truncate">{p.requestNote}</p>
 )}
 {p.attemptCount != null && p.attemptCount > 0 && (
 <p className="text-[10px] text-muted-foreground/70 mt-1">{p.attemptCount} rappel{p.attemptCount > 1 ? "s" : ""} envoyé{p.attemptCount > 1 ? "s" : ""}</p>
 )}
 {p.comment && (
 <p className="text-[11px] text-muted-foreground/70 italic mt-1 truncate">"{p.comment}"</p>
 )}
 </div>

 <p className="text-sm font-bold tabular-nums shrink-0">{formatCurrency(p.amount, currency)}</p>
 </div>

 {canRemind && onResentPayment && (
 <div className="mt-2.5 pt-2.5 border-t border-border/50">
 <div className="flex gap-2">
 {isPending && isFromCurrentUser && (
 <button
 onClick={() => onResentPayment(p.id)}
 className="flex-1 py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
 >
 <RefreshCw size={12} />
 Rappeler ({attempts + 1}/3)
 </button>
 )}
 {isPending && isFromCurrentUser && onCancelPayment && (
 <button
 onClick={() => onCancelPayment(p.id)}
 className="py-2 px-3 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
 >
 <Ban size={12} />
 </button>
 )}
 </div>
 </div>
 )}

 {!canRemind && isPending && isFromCurrentUser && attempts >= 3 && (
 <div className="mt-2.5 pt-2.5 border-t border-border/50">
 <p className="text-[11px] text-orange-400/60 flex items-center gap-1.5 justify-center">
 <AlertTriangle size={12} />
 3 rappels envoyés
 </p>
 </div>
 )}

 {isPending && isToCurrentUser && onMarkAsPaid && (
 <div className="mt-2.5 pt-2.5 border-t border-border/50">
 <div className="flex gap-2">
 <button
 onClick={() => onMarkAsPaid(p.id)}
 className="flex-1 py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
 >
 <CheckCircle size={12} />
 J'ai payé
 </button>
 {p.status !== "late" && onRefusePayment && (
 <button
 onClick={() => onRefusePayment(p.id)}
 className="py-2 px-3 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
 >
 <Ban size={12} />
 </button>
 )}
 </div>
 </div>
 )}

 {p.status === "paid" && isFromCurrentUser && onConfirmReceipt && (
 <div className="mt-2.5 pt-2.5 border-t border-border/50">
 <div className="flex gap-2">
 <button
 onClick={() => onConfirmReceipt(p.id)}
 className="flex-1 py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
 >
 <Check size={12} />
 J'ai reçu
 </button>
 {onReportNotReceived && (
 <button
 onClick={() => onReportNotReceived(p.id, "Paiement non reçu")}
 className="py-2 px-3 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
 >
 <AlertTriangle size={12} />
 </button>
 )}
 </div>
 </div>
 )}
 </div>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}
