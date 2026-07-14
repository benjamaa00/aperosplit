import { motion } from "framer-motion";
import { Check, X, RefreshCw, AlertTriangle } from "lucide-react";
import { AvatarImg } from "./AvatarImg";

interface PendingPayment {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
  originalAmount?: number;
  status: "pending" | "accepted" | "refused" | "resent" | "in_progress" | "completed" | "permanently_refused" | "disputed" | "paid";
  comment?: string;
  attemptCount?: number;
  notificationCount?: number;
}

interface Member {
  id: string;
  name: string;
  avatar: string;
}

interface PaymentRequestCardProps {
  payment: PendingPayment;
  members: Member[];
  currentMemberId: string;
  onConfirmPayment: (id: string) => void;
  onRefusePayment: (id: string, comment?: string) => void;
  onResentPayment: (id: string) => void;
  onConfirmReceipt: (id: string) => void;
  onReportNotReceived: (id: string, comment?: string) => void;
}

export function PaymentRequestCard({
  payment,
  members,
  currentMemberId,
  onConfirmPayment,
  onRefusePayment,
  onResentPayment,
  onConfirmReceipt,
  onReportNotReceived,
}: PaymentRequestCardProps) {
  const from = members.find((m) => m.id === payment.fromId);
  const to = members.find((m) => m.id === payment.toId);
  const isFromCurrentUser = payment.fromId === currentMemberId;
  const isToCurrentUser = payment.toId === currentMemberId;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = () => {
    switch (payment.status) {
      case "pending": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "accepted": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "refused": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "resent": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "disputed": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "permanently_refused": return "bg-muted/50 text-muted-foreground border-border";
      default: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  const getStatusLabel = () => {
    switch (payment.status) {
      case "pending": return "En attente";
      case "accepted": return "Accepté";
      case "refused": return "Refusé";
      case "resent": return "Renvoyé";
      case "disputed": return "Litige";
      case "permanently_refused": return "Refus définitif";
      default: return "En cours";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-card/50 backdrop-blur-sm border rounded-2xl p-4 ${getStatusColor()}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <AvatarImg avatar={from?.avatar ?? ""} size="text-2xl" />
          <div>
            <p className="text-sm font-medium">
              {isFromCurrentUser ? "Vous demandez" : `${from?.name} demande`}
              {isToCurrentUser ? " à vous" : ` à ${to?.name}`}
            </p>
            <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium px-2 py-1 rounded-full">
            {getStatusLabel()}
          </span>
          {payment.notificationCount && payment.notificationCount > 1 && (
            <p className="text-xs text-muted-foreground mt-1">
              {payment.notificationCount} rappels
            </p>
          )}
        </div>
      </div>

      {/* Comment for refused/disputed */}
      {(payment.status === "refused" || payment.status === "disputed") && payment.comment && (
        <div className="bg-background/50 rounded-lg p-2 mb-2">
          <p className="text-xs text-muted-foreground italic">"{payment.comment}"</p>
        </div>
      )}

      {/* Action buttons based on status and role */}
      <div className="flex gap-2 mt-3">
        {/* Pending status - Debiteur can accept/refuse */}
        {payment.status === "pending" && isToCurrentUser && (
          <>
            <button
              onClick={() => onConfirmPayment(payment.id)}
              className="flex-1 bg-green-500/10 text-green-400 px-3 py-2 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1"
            >
              <Check size={12} />
              Accepter
            </button>
            <button
              onClick={() => {
                const comment = prompt("Pourquoi refusez-vous ce paiement ?");
                if (comment) onRefusePayment(payment.id, comment);
              }}
              className="flex-1 bg-red-500/10 text-red-400 px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1"
            >
              <X size={12} />
              Refuser
            </button>
          </>
        )}

        {/* Accepted status - Crediteur can confirm receipt */}
        {payment.status === "accepted" && isFromCurrentUser && (
          <>
            <button
              onClick={() => onConfirmReceipt(payment.id)}
              className="flex-1 bg-green-500/10 text-green-400 px-3 py-2 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1"
            >
              <Check size={12} />
              J'ai reçu l'argent
            </button>
            <button
              onClick={() => {
                const comment = prompt("Pourquoi n'avez-vous pas reçu l'argent ?");
                if (comment) onReportNotReceived(payment.id, comment);
              }}
              className="flex-1 bg-red-500/10 text-red-400 px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1"
            >
              <AlertTriangle size={12} />
              Je n'ai pas reçu
            </button>
          </>
        )}

        {/* Refused status - Crediteur can resend (max 3 attempts) */}
        {payment.status === "refused" && isFromCurrentUser && (payment.attemptCount || 0) < 3 && (
          <button
            onClick={() => onResentPayment(payment.id)}
            className="flex-1 bg-yellow-500/10 text-yellow-400 px-3 py-2 rounded-lg text-xs font-medium hover:bg-yellow-500/20 transition-colors flex items-center justify-center gap-1"
          >
            <RefreshCw size={12} />
            Renvoyer ({(payment.attemptCount || 0) + 1}/3)
          </button>
        )}

        {/* Disputed status - Debiteur can mark as paid */}
        {payment.status === "disputed" && isToCurrentUser && (
          <button
            onClick={() => onConfirmPayment(payment.id)}
            className="flex-1 bg-blue-500/10 text-blue-400 px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1"
          >
            <Check size={12} />
            Marquer comme payé
          </button>
        )}

        {/* Permanently refused - show message */}
        {payment.status === "permanently_refused" && (
          <p className="text-xs text-muted-foreground text-center w-full">
            Maximum de tentatives atteint. Refus définitif.
          </p>
        )}
      </div>
    </motion.div>
  );
}
