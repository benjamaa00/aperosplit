import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronDown, Check, X, AlertTriangle, RefreshCw, Clock, Calendar, TrendingUp } from "lucide-react";

interface PendingPayment {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
  status: "pending" | "accepted" | "refused" | "resent" | "in_progress" | "completed" | "permanently_refused" | "disputed";
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

interface PaymentHistoryProps {
  payments: PendingPayment[];
  members: Member[];
  currentMemberId: string;
}

type FilterType = "all" | "completed" | "pending" | "refused" | "disputed";
type SortType = "date" | "amount" | "status";

export function PaymentHistory({ payments, members, currentMemberId }: PaymentHistoryProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("date");
  const [showFilters, setShowFilters] = useState(false);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "completed":
        return { label: "Terminé", color: "bg-green-500/10 text-green-400 border-green-500/20", icon: Check };
      case "pending":
        return { label: "En attente", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", icon: Clock };
      case "accepted":
        return { label: "Accepté", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Check };
      case "refused":
        return { label: "Refusé", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: X };
      case "resent":
        return { label: "Renvoyé", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: RefreshCw };
      case "disputed":
        return { label: "Litige", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: AlertTriangle };
      case "permanently_refused":
        return { label: "Refus définitif", color: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: X };
      default:
        return { label: status, color: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: Clock };
    }
  };

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    if (payment.fromId !== currentMemberId && payment.toId !== currentMemberId) {
      return false;
    }
    
    if (filter === "all") return true;
    if (filter === "completed") return payment.status === "completed";
    if (filter === "pending") return payment.status === "pending";
    if (filter === "refused") return payment.status === "refused" || payment.status === "permanently_refused";
    if (filter === "disputed") return payment.status === "disputed";
    return true;
  });

  // Sort payments
  const sortedPayments = [...filteredPayments].sort((a, b) => {
    if (sort === "date") {
      return (b.completedAt || b.respondedAt || b.createdAt) - (a.completedAt || a.respondedAt || a.createdAt);
    }
    if (sort === "amount") {
      return b.amount - a.amount;
    }
    if (sort === "status") {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Historique</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-all"
        >
          <Filter size={16} />
          Filtres
          <ChevronDown size={16} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm border border-green-500/20 rounded-3xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check size={16} className="text-green-400" />
            </div>
            <span className="text-sm font-medium text-green-400">Terminés</span>
          </div>
          <p className="text-2xl font-bold">{payments.filter(p => p.status === "completed").length}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 backdrop-blur-sm border border-orange-500/20 rounded-3xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Clock size={16} className="text-orange-400" />
            </div>
            <span className="text-sm font-medium text-orange-400">En attente</span>
          </div>
          <p className="text-2xl font-bold">{payments.filter(p => p.status === "pending").length}</p>
        </div>
      </div>

      {/* Filter Options */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-4 space-y-4"
          >
            <div>
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Statut</p>
              <div className="flex flex-wrap gap-2">
                {(["all", "completed", "pending", "refused", "disputed"] as FilterType[]).map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      filter === filterType
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "bg-white/5 text-muted-foreground hover:bg-white/10"
                    }`}
                  >
                    {filterType === "all" ? "Tous" :
                     filterType === "completed" ? "Terminés" :
                     filterType === "pending" ? "En attente" :
                     filterType === "refused" ? "Refusés" :
                     "Litiges"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Trier par</p>
              <div className="flex gap-2">
                {(["date", "amount", "status"] as SortType[]).map((sortType) => (
                  <button
                    key={sortType}
                    onClick={() => setSort(sortType)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      sort === sortType
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "bg-white/5 text-muted-foreground hover:bg-white/10"
                    }`}
                  >
                    {sortType === "date" ? "Date" : sortType === "amount" ? "Montant" : "Statut"}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment List */}
      <div className="space-y-3">
        {sortedPayments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <Calendar size={40} className="text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground">Aucun remboursement trouvé</p>
          </div>
        ) : (
          sortedPayments.map((payment, index) => {
            const from = members.find((m) => m.id === payment.fromId);
            const to = members.find((m) => m.id === payment.toId);
            const statusInfo = getStatusInfo(payment.status);
            const StatusIcon = statusInfo.icon;

            return (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white/5 backdrop-blur-sm border rounded-3xl p-4 ${statusInfo.color}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
                      {from?.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {payment.fromId === currentMemberId ? "Vous avez payé" : `${from?.name} a payé`}
                        {payment.toId === currentMemberId ? " à vous" : ` à ${to?.name}`}
                      </p>
                      <p className="text-xl font-bold">{formatCurrency(payment.amount)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <StatusIcon size={12} />
                      {statusInfo.label}
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {formatDate(payment.completedAt || payment.respondedAt || payment.createdAt)}
                    </p>
                  </div>
                </div>
                
                {(payment.status === "refused" || payment.status === "disputed") && payment.comment && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-muted-foreground italic bg-white/5 rounded-xl p-3">
                      "{payment.comment}"
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
