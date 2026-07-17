import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, Clock, Search, Receipt, ArrowUpRight, ArrowDownLeft, Check, AlertTriangle, RefreshCw, Pause, Send, ChevronDown } from "lucide-react";
import { AvatarImg } from "./AvatarImg";
import { formatCurrency } from "../utils/currency";

interface PaymentHistoryProps {
  payments: Array<{
    id: string;
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    amount: number;
    status: "pending" | "accepted" | "refused" | "resent" | "in_progress" | "completed" | "late" | "disputed" | "paid";
    createdAt?: number;
    completedAt?: number;
    respondedAt?: number;
    paidAt?: number;
    confirmedAt?: number;
    comment?: string;
    expenseId?: string;
    attemptCount?: number;
    isGroupRequest?: boolean;
  }>;
  expenses: Array<{ id: string; description: string; amount: number; payerId: string; date: number; category: string; categoryEmoji: string }>;
  members: Array<{ id: string; name: string; avatar: string }>;
  currentMemberId: string;
  currency: string;
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

export function PaymentHistory({ payments, expenses, members, currentMemberId, currency }: PaymentHistoryProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const getMember = (id: string) => members.find(m => m.id === id);

  const totalReceived = useMemo(
    () => payments.filter(p => p.toId === currentMemberId && (p.status === "completed" || p.status === "paid")).reduce((s, p) => s + p.amount, 0),
    [payments, currentMemberId]
  );

  const totalSent = useMemo(
    () => payments.filter(p => p.fromId === currentMemberId && (p.status === "completed" || p.status === "paid")).reduce((s, p) => s + p.amount, 0),
    [payments, currentMemberId]
  );

  const totalPending = useMemo(
    () => payments.filter(p => p.status === "pending" || p.status === "late" || p.status === "accepted").reduce((s, p) => s + p.amount, 0),
    [payments]
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
    const groups: Record<string, typeof payments> = {};

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

  const statusConfig: Record<string, { bg: string; dot: string; icon: React.ReactNode; label: string; pill: string }> = {
    pending: {
      bg: "text-amber-400",
      dot: "bg-amber-400",
      icon: <Clock size={11} />,
      label: "En attente",
      pill: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    },
    late: {
      bg: "text-orange-400",
      dot: "bg-orange-400",
      icon: <RefreshCw size={11} />,
      label: "En retard",
      pill: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    },
    accepted: {
      bg: "text-green-400",
      dot: "bg-green-400",
      icon: <Check size={11} />,
      label: "Accepté",
      pill: "bg-green-500/10 text-green-400 border border-green-500/20",
    },
    refused: {
      bg: "text-red-400",
      dot: "bg-red-400",
      icon: <X size={11} />,
      label: "Refusé",
      pill: "bg-red-500/10 text-red-400 border border-red-500/20",
    },
    disputed: {
      bg: "text-purple-400",
      dot: "bg-purple-400",
      icon: <AlertTriangle size={11} />,
      label: "Litige",
      pill: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    },
    paid: {
      bg: "text-blue-400",
      dot: "bg-blue-400",
      icon: <Check size={11} />,
      label: "Payé",
      pill: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    },
    completed: {
      bg: "text-green-400",
      dot: "bg-green-400",
      icon: <Check size={11} />,
      label: "Complété",
      pill: "bg-green-500/10 text-green-400 border border-green-500/20",
    },
    resent: {
      bg: "text-cyan-400",
      dot: "bg-cyan-400",
      icon: <Send size={11} />,
      label: "Renvoyé",
      pill: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
    },
    in_progress: {
      bg: "text-sky-400",
      dot: "bg-sky-400",
      icon: <Pause size={11} />,
      label: "En cours",
      pill: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
    },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto px-5 pt-12 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historique</h1>
          <p className="text-sm text-muted-foreground mt-1">{filteredPayments.length} requête{filteredPayments.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card/50 rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center">
              <ArrowDownLeft size={14} className="text-green-400" />
            </div>
          </div>
          <p className="text-sm font-bold tabular-nums text-green-400">{formatCurrency(totalReceived, currency)}</p>
          <p className="text-[10px] text-muted-foreground">Reçu</p>
        </div>
        <div className="bg-card/50 rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center">
              <ArrowUpRight size={14} className="text-orange-400" />
            </div>
          </div>
          <p className="text-sm font-bold tabular-nums text-orange-400">{formatCurrency(totalSent, currency)}</p>
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
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-muted-foreground text-sm font-medium">Aucune activité</p>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([groupLabel, items]) => (
            <div key={groupLabel}>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">{groupLabel}</p>
              <div className="space-y-2">
                {items.map((p, idx) => {
                  const from = getMember(p.fromId);
                  const to = getMember(p.toId);
                  const config = statusConfig[p.status] || statusConfig.pending;

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30, delay: idx * 0.03 }}
                      className="glass-card-enhanced rounded-[1.25rem] p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-1 h-10 rounded-full shrink-0 ${config.dot}`} />

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
                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${config.pill}`}>
                              {config.icon}
                              {config.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{relativeTime(p.createdAt || Date.now())}</span>
                          </div>
                          {p.attemptCount != null && p.attemptCount > 0 && (
                            <p className="text-[10px] text-muted-foreground/70 mt-1">{p.attemptCount} rappel{p.attemptCount > 1 ? "s" : ""} envoyé{p.attemptCount > 1 ? "s" : ""}</p>
                          )}
                          {p.comment && (
                            <p className="text-[11px] text-muted-foreground/70 italic mt-1 truncate">"{p.comment}"</p>
                          )}
                        </div>

                        <p className="text-sm font-bold tabular-nums shrink-0">{formatCurrency(p.amount, currency)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
