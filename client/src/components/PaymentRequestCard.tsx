import { useState, memo } from "react";
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
  CircleCheckBig,
  Banknote,
} from "lucide-react";
import { AvatarImg } from "./AvatarImg";
import { TextAreaPrompt } from "./TextAreaPrompt";
import { formatCurrency } from "../utils/currency";
import { getStatusBorderHex, getStatusPill, getStatusLabel } from "../utils/statusColors";
import { trpc } from "../lib/trpc";
import { haptics } from "../utils/haptics";

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
  cancelPaymentRequest?: (id: string) => void;
}

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

function getStepInfo(status: PendingPayment["status"]): {
  currentStep: number;
  label: string;
  variant: "default" | "warning" | "blocked" | "done";
} {
  switch (status) {
    case "pending":
    case "late":
      return { currentStep: 0, label: "En attente de paiement", variant: "default" };
    case "paid":
    case "accepted":
      return {
        currentStep: 1,
        label: "Paiement signalé — en attente de confirmation",
        variant: "default",
      };
    case "completed":
      return { currentStep: 2, label: "Confirmé ✓", variant: "done" };
    case "disputed":
      return { currentStep: 1, label: "Litige en cours", variant: "warning" };
    case "refused":
      return { currentStep: 0, label: "Refusé", variant: "blocked" };
    default:
      return { currentStep: 0, label: "", variant: "default" };
  }
}

function getCardGradient(status: PendingPayment["status"]): string {
  switch (status) {
    case "pending":
      return "from-primary/[0.03] via-transparent to-transparent";
    case "late":
      return "from-orange-500/[0.04] via-transparent to-transparent";
    case "paid":
      return "from-blue-500/[0.04] via-transparent to-transparent";
    case "accepted":
      return "from-emerald-500/[0.04] via-transparent to-transparent";
    case "completed":
      return "from-emerald-500/[0.06] via-transparent to-transparent";
    case "disputed":
      return "from-red-500/[0.04] via-transparent to-transparent";
    case "refused":
      return "from-red-500/[0.03] via-transparent to-transparent";
    default:
      return "from-transparent via-transparent to-transparent";
  }
}

function getAccentBorder(status: PendingPayment["status"]): string {
  const hex = getStatusBorderHex(status);
  return hex;
}

function StepIndicator({
  currentStep,
  variant,
}: {
  currentStep: number;
  variant: "default" | "warning" | "blocked" | "done";
}) {
  const steps = [1, 2];

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const filled = step <= currentStep;
        const isActive = step === currentStep + 1 && variant === "default";

        let circleClass = "bg-muted-foreground/15 border-border/40";
        if (filled) {
          if (variant === "warning" && step === 2) {
            circleClass = "bg-orange-500 border-orange-500 text-white";
          } else if (variant === "done") {
            circleClass = "bg-primary border-primary text-primary-foreground";
          } else if (variant === "blocked") {
            circleClass = "bg-red-500 border-red-500 text-white";
          } else {
            circleClass = "bg-primary border-primary text-primary-foreground";
          }
        } else if (isActive) {
          circleClass = "border-primary/50 text-primary bg-transparent animate-pulse";
        }

        return (
          <div key={step} className="flex items-center">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all duration-300 ${circleClass}`}
            >
              {filled ? (
                variant === "blocked" ? (
                  <X size={10} />
                ) : (
                  <Check size={10} />
                )
              ) : (
                step
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-5 h-[2px] mx-0.5 rounded-full transition-all duration-300 ${
                  step < currentStep
                    ? variant === "done"
                      ? "bg-primary"
                      : variant === "warning"
                        ? "bg-orange-500"
                        : variant === "blocked"
                          ? "bg-red-500"
                          : "bg-primary"
                    : "bg-muted-foreground/20"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export const PaymentRequestCard = memo(function PaymentRequestCard({
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
  cancelPaymentRequest,
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

  const { currentStep, label: stepLabel, variant: stepVariant } = getStepInfo(payment.status);
  const cardGradient = getCardGradient(payment.status);
  const accentBorder = getAccentBorder(payment.status);

  const showPulse =
    payment.status === "pending" || payment.status === "late";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className={`glass-card-enhanced rounded-[1.25rem] p-4 relative overflow-hidden`}
        style={{
          borderLeft: `3px solid ${accentBorder}`,
        }}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${cardGradient} pointer-events-none rounded-[1.25rem]`}
        />

        <div className="relative z-10">
          {/* Avatar row + status */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex flex-col items-center">
                <AvatarImg avatar={from?.avatar ?? ""} size="text-2xl" />
                <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  {isFromCurrentUser ? "Vous" : from?.name?.split(" ")[0]}
                </span>
              </div>

              <div className="flex flex-col items-center flex-shrink-0">
                <div className="flex items-center">
                  <div className="w-2.5 h-[1.5px] bg-muted-foreground/30 rounded-full" />
                  <svg
                    viewBox="0 0 20 12"
                    className="w-5 h-3 text-muted-foreground/30 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      d="M1 6h14M13 2.5l3 3.5-3 3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="w-2.5 h-[1.5px] bg-muted-foreground/30 rounded-full" />
                </div>
              </div>

              <div className="flex flex-col items-center">
                <AvatarImg avatar={to?.avatar ?? ""} size="text-2xl" />
                <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  {isToCurrentUser ? "Vous" : to?.name?.split(" ")[0]}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                  getStatusPill(payment.status)
                } ${showPulse ? "animate-pulse" : ""} ${
                  payment.status === "pending"
                    ? "shadow-[0_0_8px_oklch(0.65_0.19_264/30%)]"
                    : payment.status === "late"
                      ? "shadow-[0_0_8px_oklch(0.65_0.22_50/30%)]"
                      : ""
                }`}
              >
                {payment.status === "late" && <Clock size={10} />}
                {getStatusLabel(payment.status)}
              </span>
              <StepIndicator currentStep={currentStep} variant={stepVariant} />
            </div>
          </div>

          {/* Amount */}
          <div className="mb-1">
            <p className="text-xl font-bold tracking-tight text-foreground">
              {formatAmount(payment.amount)}
            </p>
          </div>

          {/* Who requests */}
          {isFromCurrentUser && (
            <p className="text-xs text-muted-foreground mb-0.5">
              Vous demandez{" "}
              {isToCurrentUser ? "à vous" : `à ${to?.name}`}
            </p>
          )}
          {isToCurrentUser && !isFromCurrentUser && (
            <p className="text-xs text-muted-foreground mb-0.5">
              {from?.name} vous demande
            </p>
          )}
          {!isFromCurrentUser && !isToCurrentUser && (
            <p className="text-xs text-muted-foreground mb-0.5">
              {from?.name} demande à {to?.name}
            </p>
          )}

          {/* Timestamp */}
          {payment.createdAt && (
            <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1 mb-1">
              <Clock size={10} />
              {formatRelativeTime(payment.createdAt)}
            </p>
          )}

          {/* Attempts */}
          {attempts > 0 && (
            <p className="text-[10px] text-muted-foreground/50 mb-1">
              {attempts}/3 rappels envoyés
            </p>
          )}

          {/* Request note */}
          {payment.requestNote && (
            <div className="glass-card-enhanced rounded-2xl px-3 py-2 mb-2 mt-1.5">
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                "{payment.requestNote}"
              </p>
            </div>
          )}

          {/* Refused / disputed comment */}
          {(payment.status === "refused" || payment.status === "disputed") &&
            payment.comment && (
              <div className="bg-red-500/5 border border-red-500/10 rounded-2xl px-3 py-2 mb-2 mt-1">
                <p className="text-[11px] text-red-400/80 leading-relaxed">
                  <span className="font-semibold">Motif :</span> {payment.comment}
                </p>
              </div>
            )}

          {/* Late + max reminders */}
          {payment.status === "late" && attempts >= 3 && (
            <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl px-3 py-2 mb-2 mt-1">
              <p className="text-[11px] text-orange-400 font-medium flex items-center gap-1">
                <AlertTriangle size={11} />
                Signalé en retard — 3 rappels envoyés
              </p>
            </div>
          )}

          {/* Step status text for paid/accepted */}
          {(payment.status === "paid" || payment.status === "accepted") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-blue-500/5 border border-blue-500/10 rounded-2xl px-3 py-2 mb-2 mt-1"
            >
              <p className="text-[11px] text-blue-400/90 font-medium leading-relaxed">
                {to?.name} a confirmé le paiement — en attente de confirmation de{" "}
                {from?.name}
              </p>
            </motion.div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            {/* pending/late + debtor */}
            {(payment.status === "pending" || payment.status === "late") && isToCurrentUser && (
              <>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { haptics.success(); onMarkAsPaid(payment.id); }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 glass-card-enhanced text-emerald-400 hover:bg-emerald-500/15 transition-colors"
                >
                  <Check size={13} />
                  J'ai payé
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { haptics.medium(); setShowRefuseModal(true); }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 glass-card-enhanced text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-colors"
                >
                  <X size={13} />
                  Refuser
                </motion.button>
              </>
            )}

            {/* pending/late + creditor (reminder) */}
            {(payment.status === "pending" || payment.status === "late") &&
              isFromCurrentUser &&
              attempts < 3 && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { haptics.light(); onResentPayment(payment.id); }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 glass-card-enhanced text-amber-400 hover:bg-amber-500/15 transition-colors"
                >
                  <RefreshCw size={13} />
                  Rappeler ({attempts + 1}/3)
                </motion.button>
              )}
            {(payment.status === "pending" || payment.status === "late") &&
              isFromCurrentUser &&
              attempts >= 3 && (
                <p className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 text-orange-400/60">
                  <AlertTriangle size={13} />
                  3 rappels envoyés
                </p>
              )}

            {/* paid + creditor */}
            {payment.status === "paid" && isFromCurrentUser && (
              <>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { haptics.success(); onConfirmReceipt(payment.id); }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 glass-card-enhanced text-emerald-400 hover:bg-emerald-500/15 transition-colors"
                >
                  <CircleCheckBig size={13} />
                  J'ai reçu
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { haptics.medium(); setShowNotReceivedModal(true); }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 glass-card-enhanced text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-colors"
                >
                  <AlertTriangle size={13} />
                  Pas reçu
                </motion.button>
              </>
            )}

            {/* paid + debtor: waiting info */}
            {payment.status === "paid" && isToCurrentUser && (
              <p className="flex-1 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 text-muted-foreground/60">
                En attente de confirmation de {from?.name}
              </p>
            )}

            {/* accepted + creditor */}
            {payment.status === "accepted" && isFromCurrentUser && (
              <>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { haptics.success(); onConfirmReceipt(payment.id); }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 glass-card-enhanced text-emerald-400 hover:bg-emerald-500/15 transition-colors"
                >
                  <CircleCheckBig size={13} />
                  J'ai reçu
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { haptics.medium(); setShowNotReceivedModal(true); }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 glass-card-enhanced text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-colors"
                >
                  <AlertTriangle size={13} />
                  Pas reçu
                </motion.button>
              </>
            )}

            {/* disputed + debtor */}
            {payment.status === "disputed" && isToCurrentUser && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { haptics.light(); onMarkAsPaid(payment.id); }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 glass-card-enhanced text-blue-400 hover:bg-blue-500/15 transition-colors"
              >
                <Banknote size={13} />
                Marquer payé
              </motion.button>
            )}

            {/* refused + creditor (resend) */}
            {payment.status === "refused" && isFromCurrentUser && attempts < 3 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { haptics.light(); onResentPayment(payment.id); }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 glass-card-enhanced text-amber-400 hover:bg-amber-500/15 transition-colors"
              >
                <RefreshCw size={13} />
                Renvoyer ({attempts + 1}/3)
              </motion.button>
            )}
            {payment.status === "refused" && isFromCurrentUser && attempts >= 3 && (
              <p className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 text-red-400/50">
                <AlertTriangle size={13} />
                3 tentatives épuisées
              </p>
            )}
          </div>

          {/* Comments toggle */}
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

          {/* Comments section */}
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
                    {comments.map(
                      (comment: {
                        id: string;
                        memberId: string;
                        memberName: string;
                        content: string;
                        createdAt: string;
                      }) => {
                        const commentMember = members.find(
                          (m) => m.id === comment.memberId
                        );
                        const isOwnComment =
                          comment.memberId === currentMemberId;
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
                              <AvatarImg
                                avatar={commentMember?.avatar ?? ""}
                                size="text-sm"
                              />
                              <span className="text-[10px] font-semibold text-foreground/80">
                                {comment.memberName}
                              </span>
                              <span className="text-[9px] text-muted-foreground/50 ml-auto">
                                {formatRelativeTime(
                                  new Date(comment.createdAt).getTime()
                                )}
                              </span>
                            </div>
                            <p className="text-xs text-foreground/70 leading-relaxed pl-[22px]">
                              {comment.content}
                            </p>
                          </motion.div>
                        );
                      }
                    )}
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
                      disabled={
                        !newComment.trim() || addCommentMutation.isPending
                      }
                      className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send size={14} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Refuse modal */}
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
              className="glass-card-enhanced rounded-[1.25rem] p-6 w-full max-w-sm shadow-xl"
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
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold glass-card-enhanced text-muted-foreground hover:bg-muted/50 transition-colors"
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
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold glass-card-enhanced text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
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
});

PaymentRequestCard.displayName = "PaymentRequestCard";
