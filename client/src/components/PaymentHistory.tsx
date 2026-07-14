import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, Clock, Search, Receipt, ArrowUpRight, ArrowDownLeft, Trash2, Check, AlertTriangle } from "lucide-react";
import { MemberSelect } from "./MemberSelect";
import { AvatarImg } from "./AvatarImg";

interface PendingPayment {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
  status: "pending" | "accepted" | "refused" | "resent" | "in_progress" | "completed" | "late" | "disputed" | "paid";
  comment?: string;
  createdAt: number;
  completedAt?: number;
  respondedAt?: number;
  expenseId?: string;
}

interface Member {
  id: string;
  name: string;
  avatar: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  payerId: string;
  category: string;
  categoryEmoji: string;
  date: number;
  participants: string[];
}

interface ActivityItem {
  id: string;
  type: "expense_added" | "expense_deleted" | "payment_request" | "payment_accepted" | "payment_refused" | "payment_completed" | "payment_disputed" | "member_joined" | "member_expelled";
  timestamp: number;
  description: string;
  amount?: number;
  fromId?: string;
  fromName?: string;
  fromAvatar?: string;
  toId?: string;
  toName?: string;
  toAvatar?: string;
  status?: string;
  emoji: string;
}

interface PaymentHistoryProps {
  payments: PendingPayment[];
  expenses: Expense[];
  members: Member[];
  currentMemberId: string;
}

type FilterType = "all" | "expenses" | "payments" | "inflows";

export function PaymentHistory({ payments, expenses, members, currentMemberId }: PaymentHistoryProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const fmt = (amount: number) => new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", minimumFractionDigits: 2 }).format(amount);

  const getMember = (id: string) => members.find(m => m.id === id);

  // Build unified activity feed
  const activities = useMemo(() => {
    const items: ActivityItem[] = [];

    expenses.forEach(e => {
      const payer = getMember(e.payerId);
      items.push({
        id: e.id,
        type: "expense_added",
        timestamp: new Date(e.date).getTime(),
        description: e.description,
        amount: e.amount,
        fromId: e.payerId,
        fromName: payer?.name,
        fromAvatar: payer?.avatar,
        emoji: e.categoryEmoji || "📦",
      });
    });

    payments.forEach(p => {
      const from = getMember(p.fromId);
      const to = getMember(p.toId);
      let type: ActivityItem["type"] = "payment_request";
      let emoji = "💸";
      if (p.status === "completed") { type = "payment_completed"; emoji = "✅"; }
      else if (p.status === "accepted") { emoji = "👍"; }
      else if (p.status === "refused" || p.status === "late") { type = "payment_refused"; emoji = "❌"; }
      else if (p.status === "disputed") { type = "payment_disputed"; emoji = "⚠️"; }

      items.push({
        id: p.id,
        type,
        timestamp: p.completedAt || p.respondedAt || p.createdAt,
        description: `${from?.name || "?"} → ${to?.name || "?"}`,
        amount: p.amount,
        fromId: p.fromId,
        fromName: from?.name,
        fromAvatar: from?.avatar,
        toId: p.toId,
        toName: to?.name,
        toAvatar: to?.avatar,
        status: p.status,
        emoji,
      });
    });

    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [expenses, payments, members]);

  const filtered = useMemo(() => {
    return activities.filter(a => {
      let matchFilter = true;
      if (filter === "expenses") matchFilter = a.type === "expense_added" || a.type === "expense_deleted";
      else if (filter === "payments") matchFilter = a.type.startsWith("payment_");
      else if (filter === "inflows") {
        matchFilter = (a.fromId === currentMemberId || a.toId === currentMemberId) && a.type.startsWith("payment_");
      }
      if (!matchFilter) return false;
      if (selectedMember) {
        if (a.fromId !== selectedMember && a.toId !== selectedMember && a.fromId !== undefined) return false;
        if (a.fromId === undefined && a.toId === undefined) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return a.description.toLowerCase().includes(q) || a.fromName?.toLowerCase().includes(q) || a.toName?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activities, filter, search, currentMemberId, selectedMember]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, ActivityItem[]> = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = today - 7 * 86400_000;
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();

    filtered.forEach(a => {
      let key: string;
      if (a.timestamp >= today) key = "Aujourd'hui";
      else if (a.timestamp >= weekAgo) key = "Cette semaine";
      else if (a.timestamp >= monthAgo) key = "Ce mois";
      else key = "Plus ancien";
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    return groups;
  }, [filtered]);

  const totalIn = useMemo(() => payments.filter(p => p.toId === currentMemberId && p.status === "completed").reduce((s, p) => s + p.amount, 0), [payments, currentMemberId]);
  const totalOut = useMemo(() => payments.filter(p => p.fromId === currentMemberId && p.status === "completed").reduce((s, p) => s + p.amount, 0), [payments, currentMemberId]);
  const totalSpent = useMemo(() => expenses.filter(e => e.payerId === currentMemberId).reduce((s, e) => s + e.amount, 0), [expenses, currentMemberId]);

  const statusColor = (status?: string) => {
    switch (status) {
      case "completed": return "text-green-400 bg-green-500/10 border-green-500/20";
      case "pending": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "late": return "text-red-400 bg-red-500/10 border-red-500/20";
      case "accepted": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "refused": return "text-red-400 bg-red-500/10 border-red-500/20";
      case "disputed": return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      case "paid": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
      default: return "text-muted-foreground bg-muted border-border";
    }
  };

  const statusLabel = (status?: string) => {
    switch (status) {
      case "completed": return "Terminé";
      case "pending": return "En attente";
      case "late": return "En retard";
      case "accepted": return "Accepté";
      case "refused": return "Refusé";
      case "disputed": return "Litige";
      case "paid": return "Payé";
      default: return status;
    }
  };

  const iconForType = (type: ActivityItem["type"]) => {
    switch (type) {
      case "expense_added": return Receipt;
      case "expense_deleted": return Trash2;
      case "payment_request": return ArrowUpRight;
      case "payment_completed": return Check;
      case "payment_refused": return X;
      case "payment_disputed": return AlertTriangle;
      default: return Clock;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto px-5 pt-12 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historique</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} activités</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card-enhanced rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center">
              <ArrowDownLeft size={14} className="text-green-400" />
            </div>
          </div>
          <p className="text-sm font-bold text-green-400">{fmt(totalIn)}</p>
          <p className="text-[10px] text-muted-foreground">Reçu</p>
        </div>
        <div className="glass-card-enhanced rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center">
              <ArrowUpRight size={14} className="text-orange-400" />
            </div>
          </div>
          <p className="text-sm font-bold text-orange-400">{fmt(totalOut)}</p>
          <p className="text-[10px] text-muted-foreground">Envoyé</p>
        </div>
        <div className="glass-card-enhanced rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Receipt size={14} className="text-primary" />
            </div>
          </div>
          <p className="text-sm font-bold">{fmt(totalSpent)}</p>
          <p className="text-[10px] text-muted-foreground">Dépensé</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 flex-wrap">
        {([
          ["all", "Tout", "📋"],
          ["expenses", "Dépenses", "🧾"],
          ["payments", "Paiements", "💸"],
          ["inflows", "Mes flux", "👤"],
        ] as [FilterType, string, string][]).map(([key, label, emoji]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 ${filter === key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}>
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Member Filter */}
      <MemberSelect
        members={members}
        selected={selectedMember}
        onChange={setSelectedMember}
        allLabel="Tous les membres"
      />

      {/* Grouped Activity */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
            <Clock size={36} className="text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground text-sm">Aucune activité</p>
        </div>
      ) : (
        Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3 px-1">{group}</p>
            <div className="space-y-2">
              {items.map((item, idx) => {
                const Icon = iconForType(item.type);
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="glass-card-enhanced rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center text-lg shrink-0">
                      {item.fromAvatar ? <AvatarImg avatar={item.fromAvatar} size="text-lg" /> : <Icon size={18} className="text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">
                          {item.type === "expense_added" ? item.description : item.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(item.timestamp).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {item.status && item.type.startsWith("payment_") && (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColor(item.status)}`}>
                            {statusLabel(item.status)}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.amount !== undefined && (
                      <p className={`text-sm font-bold shrink-0 ${item.type === "expense_added" ? "" : item.type === "expense_deleted" ? "text-red-400" : ""}`}>
                        {item.type === "expense_added" ? `−${fmt(item.amount)}` : item.type === "expense_deleted" ? `+${fmt(item.amount)}` : fmt(item.amount)}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </motion.div>
  );
}
