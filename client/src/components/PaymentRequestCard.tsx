import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RefreshCw, AlertTriangle, Clock, Send } from "lucide-react";
import { AvatarImg } from "./AvatarImg";

interface PendingPayment {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
  originalAmount?: number;
  status: "pending" | "accepted" | "refused" | "resent" | "in_progress" | "completed" | "late" | "disputed" | "paid";
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
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [refuseComment, setRefuseComment] = useState("");
  const from = members.find((m) => m.id === payment.fromId);
  const to = members.find((m) => m.id === payment.toId);
  const isFromCurrentUser = payment.fromId === currentMemberId;
  const isToCurrentUser = payment.toId === currentMemberId;
  const attempts = payment.attemptCount || 0;

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
      case "late": return "bg-red-500/10 text-red-400 border-red-500/30";
      case "accepted": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "refused": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "disputed": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  const getStatusLabel = () => {
    switch (payment.status) {
      case "pending": return "En attente";
      case "late": return attempts >= 3 ? "En retard" : "En attente";
      case "accepted": return "Accepté";
      case "refused": return "Refusé";
      case "disputed": return "Litige";
      default: return "En cours";
    }
  };

  return (
    <>
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
            <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${payment.status === "late" ? "bg-red-500/20 text-red-400 animate-pulse" : ""}`}>
              {payment.status === "late" && <Clock size={10} />}
              {getStatusLabel()}
            </span>
            {attempts > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1">
                {attempts}/3 rappels
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

        {/* Late warning banner */}
        {payment.status === "late" && attempts >= 3 && (
          <div className="bg-red-500/10 rounded-lg p-2 mb-2 border border-red-500/20">
            <p className="text-xs text-red-400 font-medium">Signalé en retard - 3 rappels envoyés</p>
          </div>
        )}

        {/* Action buttons based on status and role */}
        <div className="flex gap-2 mt-3">
          {/* Pending status - Debiteur can accept/refuse + Crediteur can send reminder */}
          {payment.status === "pending" && (
            <>
              {isToCurrentUser && (
                <>
                  <button
                    onClick={() => onConfirmPayment(payment.id)}
                    className="flex-1 bg-green-500/10 text-green-400 px-3 py-2 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1"
                  >
                    <Check size={12} />
                    Accepter
                  </button>
                  <button
                    onClick={() => setShowRefuseModal(true)}
                    className="flex-1 bg-red-500/10 text-red-400 px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1"
                  >
                    <X size={12} />
                    Refuser
                  </button>
                </>
              )}
              {isFromCurrentUser && (
                <button
                  onClick={() => onResentPayment(payment.id)}
                  className="flex-1 bg-yellow-500/10 text-yellow-400 px-3 py-2 rounded-lg text-xs font-medium hover:bg-yellow-500/20 transition-colors flex items-center justify-center gap-1"
                >
                  <Send size={12} />
                  Rappeler
                </button>
              )}
            </>
          )}

          {/* Late status - Debiteur can accept/refuse + Crediteur can send reminder */}
          {payment.status === "late" && (
            <>
              {isToCurrentUser && (
                <>
                  <button
                    onClick={() => onConfirmPayment(payment.id)}
                    className="flex-1 bg-green-500/10 text-green-400 px-3 py-2 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1"
                  >
                    <Check size={12} />
                    Accepter
                  </button>
                  <button
                    onClick={() => setShowRefuseModal(true)}
                    className="flex-1 bg-red-500/10 text-red-400 px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1"
                  >
                    <X size={12} />
                    Refuser
                  </button>
                </>
              )}
              {isFromCurrentUser && (
                <button
                  onClick={() => onResentPayment(payment.id)}
                  className="flex-1 bg-yellow-500/10 text-yellow-400 px-3 py-2 rounded-lg text-xs font-medium hover:bg-yellow-500/20 transition-colors flex items-center justify-center gap-1"
                >
                  <RefreshCw size={12} />
                  Rappeler ({attempts + 1}/3)
                </button>
              )}
            </>
          )}

          {/* Refused status - Crediteur can resend */}
          {payment.status === "refused" && isFromCurrentUser && (
            <button
              onClick={() => onResentPayment(payment.id)}
              className="flex-1 bg-yellow-500/10 text-yellow-400 px-3 py-2 rounded-lg text-xs font-medium hover:bg-yellow-500/20 transition-colors flex items-center justify-center gap-1"
            >
              <RefreshCw size={12} />
              Renvoyer ({attempts + 1}/3)
            </button>
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
                Pas reçu
              </button>
            </>
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
        </div>
      </motion.div>

      {/* Refuse Modal */}
      <AnimatePresence>
        {showRefuseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6"
            onClick={() => setShowRefuseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl"
            >
              <h3 className="text-lg font-bold mb-2">Refuser le paiement</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Expliquez pourquoi vous refusez ce paiement de {formatCurrency(payment.amount)}
              </p>
              <textarea
                value={refuseComment}
                onChange={(e) => setRefuseComment(e.target.value)}
                placeholder="Raison du refus..."
                className="w-full bg-background border border-border rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setShowRefuseModal(false); setRefuseComment(""); }}
                  className="flex-1 bg-muted/30 text-muted-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    onRefusePayment(payment.id, refuseComment || "Aucune raison donnée");
                    setShowRefuseModal(false);
                    setRefuseComment("");
                  }}
                  className="flex-1 bg-red-500/10 text-red-400 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-colors"
                >
                  Confirmer le refus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
