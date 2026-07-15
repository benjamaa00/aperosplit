import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Clock,
  Send,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AvatarImg } from "./AvatarImg";
import { TextAreaPrompt } from "./TextAreaPrompt";
import { formatCurrency } from "../utils/currency";
import { trpc } from "../lib/trpc";
import { GROUP_ID } from "../constants";

interface PendingPayment {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
  originalAmount?: number;
  status:
    | "pending"
    | "accepted"
    | "refused"
    | "resent"
    | "in_progress"
    | "completed"
    | "late"
    | "disputed"
    | "paid";
  comment?: string;
  attemptCount?: number;
  notificationCount?: number;
  createdAt?: number;
  expenseId?: string;
  requestNote?: string;
  isGroupRequest?: boolean;
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
  currency: string;
  onConfirmPayment: (id: string) => void;
  onRefusePayment: (id: string, comment?: string) => void;
  onResentPayment: (id: string) => void;
  onConfirmReceipt: (id: string) => void;
  onReportNotReceived: (id: string, comment?: string) => void;
  onMarkAsPaid: (id: string) => void;
}

const BORDER_COLORS: Record<string, string> = {
  pending: "border-l-amber-500",
  late: "border-l-orange-500",
  refused: "border-l-red-500",
  accepted: "border-l-emerald-500",
  disputed: "border-l-purple-500",
  paid: "border-l-blue-500",
  completed: "border-l-green-500",
  in_progress: "border-l-blue-400",
  resent: "border-l-amber-400",
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  late: "bg-orange-500/10 text-orange-400 border border-orange-500/30",
  refused: "bg-red-500/10 text-red-400 border border-red-500/20",
  accepted: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  disputed: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  paid: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  completed: "bg-green-500/10 text-green-400 border border-green-500/20",
  in_progress: "bg-blue-400/10 text-blue-300 border border-blue-400/20",
  resent: "bg-amber-400/10 text-amber-300 border border-amber-400/20",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  late: "En retard",
  refused: "Refusé",
  accepted: "Accepté",
  disputed: "Litige",
  paid: "Payé",
  completed: "Terminé",
  in_progress: "En cours",
  resent: "Renvoyé",
};

function formatRelativeTime(createdAt?: number): string {
  if (!createdAt) return "";
  const now = Date.now();
  const diff = now - createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) {
    return `Demandé il y a ${minutes} min`;
  }
  if (hours < 24) {
    return `Demandé il y a ${hours}h`;
  }
  return `Demandé il y a ${days}j`;
}

export function PaymentRequestCard({
  payment,
  members,
  currentMemberId,
  currency,
  onConfirmPayment,
  onRefusePayment,
  onResentPayment,
  onConfirmReceipt,
  onReportNotReceived,
  onMarkAsPaid,
}: PaymentRequestCardProps) {
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [refuseComment, setRefuseComment] = useState("");
  const [showNotReceivedModal, setShowNotReceivedModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  const from = members.find((m) => m.id === payment.fromId);
  const to = members.find((m) => m.id === payment.toId);
  const isFromCurrentUser = payment.fromId === currentMemberId;
  const isToCurrentUser = payment.toId === currentMemberId;
  const attempts = payment.attemptCount || 0;

  const commentsQuery = trpc.equilibra.getPaymentComments.useQuery(
    { paymentId: payment.id },
    { enabled: showComments }
  );

  const addCommentMutation = trpc.equilibra.addPaymentComment.useMutation({
    onSuccess: () => {
      commentsQuery.refetch();
      setNewComment("");
    },
  });

  const comments = commentsQuery.data?.comments ?? [];

  const formatAmount = (amount: number): string => formatCurrency(amount, currency);

  const handleAddComment = () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;
    addCommentMutation.mutate({
      paymentId: payment.id,
      memberId: currentMemberId,
      memberName: from?.id === currentMemberId ? from.name : to?.name ?? "Membre",
      content: trimmed,
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-card/80 backdrop-blur-md border border-border/60 rounded-[1.25rem] p-4 border-l-4 shadow-sm"
        style={{
          borderLeftColor: BORDER_COLORS[payment.status]?.includes("amber")
            ? "#f59e0b"
            : BORDER_COLORS[payment.status]?.includes("orange")
            ? "#f97316"
            : BORDER_COLORS[payment.status]?.includes("red")
            ? "#ef4444"
            : BORDER_COLORS[payment.status]?.includes("emerald")
            ? "#10b981"
            : BORDER_COLORS[payment.status]?.includes("purple")
            ? "#a855f7"
            : BORDER_COLORS[payment.status]?.includes("blue")
            ? "#3b82f6"
            : BORDER_COLORS[payment.status]?.includes("green")
            ? "#22c55e"
            : "#6b7280",
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <AvatarImg avatar={from?.avatar ?? ""} size="text-2xl" />
            <div className="flex flex-col items-center px-1">
              <div className="w-6 h-[1px] bg-muted-foreground/20" />
              <span className="text-[10px] text-muted-foreground font-medium">
                {isFromCurrentUser ? "Vous" : from?.name?.split(" ")[0]}
              </span>
            </div>
            <svg
              viewBox="0 0 16 16"
              className="w-4 h-4 text-muted-foreground/40 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M3 8h10M10 4l3.5 4-3.5 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <AvatarImg avatar={to?.avatar ?? ""} size="text-2xl" />
            <div className="flex flex-col items-center px-1">
              <div className="w-6 h-[1px] bg-muted-foreground/20" />
              <span className="text-[10px] text-muted-foreground font-medium">
                {isToCurrentUser ? "Vous" : to?.name?.split(" ")[0]}
              </span>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                STATUS_BADGE_STYLES[payment.status] ?? STATUS_BADGE_STYLES.pending
              } ${payment.status === "late" ? "animate-pulse" : ""}`}
            >
              {payment.status === "late" && <Clock size={10} />}
              {STATUS_LABELS[payment.status] ?? "Inconnu"}
            </span>
          </div>
        </div>

        <div className="mb-2">
          <p className="text-xl font-bold tracking-tight text-foreground">
            {formatAmount(payment.amount)}
          </p>
        </div>

        {isFromCurrentUser && (
          <p className="text-xs text-muted-foreground mb-1">
            Vous demandez{" "}
            {isToCurrentUser ? "à vous" : `à ${to?.name}`}
          </p>
        )}
        {isToCurrentUser && !isFromCurrentUser && (
          <p className="text-xs text-muted-foreground mb-1">
            {from?.name} vous demande
          </p>
        )}
        {!isFromCurrentUser && !isToCurrentUser && (
          <p className="text-xs text-muted-foreground mb-1">
            {from?.name} demande à {to?.name}
          </p>
        )}

        {payment.createdAt && (
          <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1 mb-1">
            <Clock size={10} />
            {formatRelativeTime(payment.createdAt)}
          </p>
        )}

        {attempts > 0 && (
          <p className="text-[10px] text-muted-foreground/60 mb-1">
            {attempts}/3 rappels envoyés
          </p>
        )}

        {payment.requestNote && (
          <div className="bg-muted/30 rounded-2xl px-3 py-2 mb-2 mt-2">
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              "{payment.requestNote}"
            </p>
          </div>
        )}

        {(payment.status === "refused" || payment.status === "disputed") &&
          payment.comment && (
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl px-3 py-2 mb-2 mt-1">
              <p className="text-[11px] text-red-400/80 leading-relaxed">
                <span className="font-semibold">Motif :</span> {payment.comment}
              </p>
            </div>
          )}

        {payment.status === "late" && attempts >= 3 && (
          <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl px-3 py-2 mb-2 mt-1">
            <p className="text-[11px] text-orange-400 font-medium flex items-center gap-1">
              <AlertTriangle size={11} />
              Signalé en retard — 3 rappels envoyés
            </p>
          </div>
        )}

        <div className="flex gap-2 mt-3">
          {payment.status === "pending" && (
            <>
              {isToCurrentUser && (
                <>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onConfirmPayment(payment.id)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    <Check size={13} />
                    Accepter
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowRefuseModal(true)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                  >
                    <X size={13} />
                    Refuser
                  </motion.button>
                </>
              )}
              {isFromCurrentUser && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onResentPayment(payment.id)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  <Send size={13} />
                  Rappeler
                </motion.button>
              )}
            </>
          )}

          {payment.status === "late" && (
            <>
              {isToCurrentUser && (
                <>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onConfirmPayment(payment.id)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    <Check size={13} />
                    Accepter
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowRefuseModal(true)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                  >
                    <X size={13} />
                    Refuser
                  </motion.button>
                </>
              )}
              {isFromCurrentUser && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onResentPayment(payment.id)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  <RefreshCw size={13} />
                  Rappeler ({attempts + 1}/3)
                </motion.button>
              )}
            </>
          )}

          {payment.status === "refused" && isFromCurrentUser && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onResentPayment(payment.id)}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <RefreshCw size={13} />
              Renvoyer ({attempts + 1}/3)
            </motion.button>
          )}

          {payment.status === "accepted" && isFromCurrentUser && (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onConfirmReceipt(payment.id)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                <Check size={13} />
                J'ai reçu
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotReceivedModal(true)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                <AlertTriangle size={13} />
                Pas reçu
              </motion.button>
            </>
          )}

          {payment.status === "disputed" && isToCurrentUser && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onMarkAsPaid(payment.id)}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              <Check size={13} />
              Marquer payé
            </motion.button>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowComments(!showComments)}
          className="w-full flex items-center justify-center gap-1.5 mt-3 py-2 rounded-xl text-[11px] font-medium text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted/20 transition-all"
        >
          <MessageSquare size={13} />
          <span>
            Commentaires
            {comments.length > 0 && ` (${comments.length})`}
          </span>
          {showComments ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </motion.button>

        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-border/40 mt-2">
                {commentsQuery.isLoading && (
                  <p className="text-[11px] text-muted-foreground/50 text-center py-3">
                    Chargement des commentaires...
                  </p>
                )}

                {!commentsQuery.isLoading && comments.length === 0 && (
                  <p className="text-[11px] text-muted-foreground/50 text-center py-3">
                    Aucun commentaire pour l'instant
                  </p>
                )}

                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {comments.map((comment: { id: string; memberId: string; memberName: string; content: string; createdAt: string }) => {
                    const commentMember = members.find((m) => m.id === comment.memberId);
                    const isOwnComment = comment.memberId === currentMemberId;
                    return (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-muted/30 rounded-2xl px-3 py-2 ${
                          isOwnComment ? "ml-6" : "mr-6"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <AvatarImg avatar={commentMember?.avatar ?? ""} size="text-sm" />
                          <span className="text-[10px] font-semibold text-foreground/80">
                            {comment.memberName}
                          </span>
                          <span className="text-[9px] text-muted-foreground/50 ml-auto">
                            {formatRelativeTime(new Date(comment.createdAt).getTime())}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/70 leading-relaxed pl-[22px]">
                          {comment.content}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    placeholder="Écrire un commentaire..."
                    className="flex-1 bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40"
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={14} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-[1.25rem] p-6 w-full max-w-sm shadow-xl"
            >
              <h3 className="text-lg font-bold mb-2">Refuser le paiement</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Expliquez pourquoi vous refusez ce paiement de{" "}
                {formatAmount(payment.amount)}
              </p>
              <textarea
                value={refuseComment}
                onChange={(e) => setRefuseComment(e.target.value)}
                placeholder="Raison du refus..."
                className="w-full bg-muted/30 border border-border rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowRefuseModal(false);
                    setRefuseComment("");
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  Annuler
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onRefusePayment(
                      payment.id,
                      refuseComment || "Aucune raison donnée"
                    );
                    setShowRefuseModal(false);
                    setRefuseComment("");
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                >
                  Confirmer le refus
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TextAreaPrompt
        open={showNotReceivedModal}
        onClose={() => setShowNotReceivedModal(false)}
        onConfirm={(comment) => onReportNotReceived(payment.id, comment)}
        title="Pas reçu l'argent ?"
        description="Expliquez pourquoi vous n'avez pas reçu ce paiement"
        placeholder="Raison du litige..."
        confirmLabel="Signaler"
      />
    </>
  );
}
