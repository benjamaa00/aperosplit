import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronDown, Check, X, AlertTriangle, RefreshCw, Clock } from "lucide-react";

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
    // Only show payments involving current member
    if (payment.fromId !== currentMemberId && payment.toId !== currentMemberId) {
      return false;
    }
    
    // Apply status filter
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
    <div className="space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Historique des remboursements</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Filter size={14} />
          Filtres
          <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Filter Options */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4"
          >
            <div className="flex flex-wrap gap-2">
              {(["all", "completed", "pending", "refused", "disputed"] as FilterType[]).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filter === filterType
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/50 text-muted-foreground hover:bg-background/80"
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
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <span className="text-xs text-muted-foreground">Trier par:</span>
              {(["date", "amount", "status"] as SortType[]).map((sortType) => (
                <button
                  key={sortType}
                  onClick={() => setSort(sortType)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    sort === sortType
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {sortType === "date" ? "Date" : sortType === "amount" ? "Montant" : "Statut"}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment List */}
      <div className="space-y-2">
        {sortedPayments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <div className="text-3xl mb-2">📭</div>
            Aucun remboursement trouvé
          </div>
        ) : (
          sortedPayments.map((payment) => {
            const from = members.find((m) => m.id === payment.fromId);
            const to = members.find((m) => m.id === payment.toId);
            const statusInfo = getStatusInfo(payment.status);
            const StatusIcon = statusInfo.icon;

            return (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-card/50 backdrop-blur-sm border rounded-xl p-3 ${statusInfo.color}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{from?.avatar}</span>
                    <div>
                      <p className="text-sm font-medium">
                        {payment.fromId === currentMemberId ? "Vous avez payé" : `${from?.name} a payé`}
                        {payment.toId === currentMemberId ? " à vous" : ` à ${to?.name}`}
                      </p>
                      <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                      <StatusIcon size={10} />
                      {statusInfo.label}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDate(payment.completedAt || payment.respondedAt || payment.createdAt)}
                    </p>
                  </div>
                </div>
                
                {/* Comment for refused/disputed */}
                {(payment.status === "refused" || payment.status === "disputed") && payment.comment && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <p className="text-xs text-muted-foreground italic">"{payment.comment}"</p>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
        <div className="bg-green-500/10 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-green-400">
            {payments.filter(p => p.status === "completed").length}
          </p>
          <p className="text-[10px] text-muted-foreground">Terminés</p>
        </div>
        <div className="bg-orange-500/10 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-orange-400">
            {payments.filter(p => p.status === "pending").length}
          </p>
          <p className="text-[10px] text-muted-foreground">En attente</p>
        </div>
      </div>
    </div>
  );
}
