import type { Expense, Member, PendingPayment } from "../types";
import { formatCurrency, formatDate } from "./currency";

export function simplifyDebts(
  balances: Record<string, number>,
  pendingPayments: PendingPayment[] = []
): Array<{ from: string; to: string; amount: number; explanation: string }> {
  const adjusted = { ...balances };

  pendingPayments.forEach((p) => {
    if (p.status !== "pending" && p.status !== "late" && p.status !== "accepted") return;
    if (adjusted[p.fromId] !== undefined) adjusted[p.fromId] += p.amount;
    if (adjusted[p.toId] !== undefined) adjusted[p.toId] -= p.amount;
  });

  const debtors: Array<{ id: string; amount: number }> = [];
  const creditors: Array<{ id: string; amount: number }> = [];

  Object.entries(adjusted).forEach(([id, balance]) => {
    if (balance < -0.001) debtors.push({ id, amount: -balance });
    else if (balance > 0.001) creditors.push({ id, amount: balance });
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions: Array<{ from: string; to: string; amount: number; explanation: string }> = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > 0.001) {
      transactions.push({
        from: debtors[i].id,
        to: creditors[j].id,
        amount,
        explanation: `Pour équilibrer les comptes`
      });
    }
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount < 0.001) i++;
    if (creditors[j].amount < 0.001) j++;
  }

  return transactions;
}

export function calculateMemberBreakdown(
  memberId: string,
  expenses: Expense[],
  members: Member[],
  completedPayments: PendingPayment[] = []
): {
  totalPaid: number;
  totalShare: number;
  balance: number;
  owesTo: Array<{ to: string; amount: number; reason: string }>;
  owedBy: Array<{ from: string; amount: number; reason: string }>;
} {
  let totalPaid = 0;
  let totalShare = 0;
  let paymentAdjustment = 0;
  const owesTo: Array<{ to: string; amount: number; reason: string }> = [];
  const owedBy: Array<{ from: string; amount: number; reason: string }> = [];

  expenses.forEach((exp) => {
    const len = exp.participants.length;
    if (len === 0) return;

    const memberShare = exp.participants.includes(memberId) ? exp.amount / len : 0;
    totalShare += memberShare;

    if (exp.payerId === memberId) {
      totalPaid += exp.amount;
    }

    if (exp.payerId !== memberId && exp.participants.includes(memberId)) {
      const amount = exp.amount / len;
      owesTo.push({
        to: exp.payerId,
        amount,
        reason: `${exp.description} (${formatDate(exp.date)})`
      });
    }

    if (exp.payerId === memberId) {
      exp.participants.forEach((participantId) => {
        if (participantId !== memberId) {
          const amount = exp.amount / len;
          owedBy.push({
            from: participantId,
            amount,
            reason: `${exp.description} (${formatDate(exp.date)})`
          });
        }
      });
    }
  });

  completedPayments.forEach((p) => {
    if (p.status !== "completed" && p.status !== "paid") return;
    if (p.fromId === memberId) paymentAdjustment -= p.amount;
    if (p.toId === memberId) paymentAdjustment += p.amount;
  });

  const balance = totalPaid - totalShare + paymentAdjustment;

  return {
    totalPaid,
    totalShare,
    balance,
    owesTo,
    owedBy
  };
}
