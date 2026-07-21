import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, PieChart, Users, Calendar, Target, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "../utils/currency";
import type { Expense, Member, GroupCategory } from "../types";

const MONTHS_FR = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];
const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

interface AdvancedAnalyticsProps {
  expenses: Expense[];
  members: Member[];
  categories: GroupCategory[];
  currency: string;
}

const CollapsibleSection = memo(function CollapsibleSection({
  title, icon: Icon, children, defaultOpen = true,
}: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card-enhanced rounded-[1.25rem] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon size={16} className="text-primary" />
          </div>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
});

export const AdvancedAnalytics = memo(function AdvancedAnalytics({
  expenses, members, categories, currency,
}: AdvancedAnalyticsProps) {
  const [budget, setBudget] = useState(5000);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { label: string; total: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const monthExpenses = expenses.filter(e => {
        const ed = new Date(e.date);
        return ed.getMonth() === month && ed.getFullYear() === year;
      });
      months.push({
        label: MONTHS_FR[month],
        total: monthExpenses.reduce((s, e) => s + e.amount, 0),
        count: monthExpenses.length,
      });
    }
    return months;
  }, [expenses]);

  const maxMonthly = useMemo(() => Math.max(...monthlyData.map(m => m.total), 1), [monthlyData]);

  const categoryData = useMemo(() => {
    const map = new Map<string, { name: string; emoji: string; total: number; color: string }>();
    for (const e of expenses) {
      const cat = categories.find(c => c.name === e.category);
      const key = e.category || "Autre";
      const existing = map.get(key);
      if (existing) {
        existing.total += e.amount;
      } else {
        map.set(key, {
          name: e.category || "Autre",
          emoji: e.categoryEmoji || cat?.emoji || "📦",
          total: e.amount,
          color: cat?.color || "#6b7280",
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [expenses, categories]);

  const maxCategory = useMemo(() => Math.max(...categoryData.map(c => c.total), 1), [categoryData]);
  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  const memberData = useMemo(() => {
    const map = new Map<string, { name: string; paid: number; owes: number }>();
    for (const m of members) {
      map.set(m.id, { name: m.name, paid: 0, owes: 0 });
    }
    for (const e of expenses) {
      const payer = map.get(e.payerId);
      if (payer) payer.paid += e.amount;
      const share = e.amount / e.participants.length;
      for (const pid of e.participants) {
        const member = map.get(pid);
        if (member) member.owes += share;
      }
    }
    return Array.from(map.values()).filter(m => m.paid > 0 || m.owes > 0);
  }, [expenses, members]);

  const maxMember = useMemo(() => Math.max(...memberData.map(m => Math.max(m.paid, m.owes)), 1), [memberData]);

  const dayOfWeekData = useMemo(() => {
    const totals = [0, 0, 0, 0, 0, 0, 0];
    for (const e of expenses) {
      const day = new Date(e.date).getDay();
      const idx = day === 0 ? 6 : day - 1;
      totals[idx] += e.amount;
    }
    return DAYS_FR.map((label, i) => ({ label, total: totals[i] }));
  }, [expenses]);

  const maxDay = useMemo(() => Math.max(...dayOfWeekData.map(d => d.total), 1), [dayOfWeekData]);

  const totalPaid = useMemo(() => memberData.reduce((s, m) => s + m.paid, 0), [memberData]);
  const totalOwed = useMemo(() => memberData.reduce((s, m) => s + m.owes, 0), [memberData]);

  return (
    <div className="space-y-4">
      <CollapsibleSection title="Evolution mensuelle" icon={TrendingUp}>
        {expenses.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Aucune donnee pour cette periode</p>
        ) : (
          <>
            <div className="flex items-end gap-2 h-40">
              {monthlyData.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">{m.total > 0 ? formatCurrency(m.total, currency) : ""}</span>
                  <div className="w-full relative" style={{ height: `${Math.max((m.total / maxMonthly) * 100, 4)}%` }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "100%" }}
                      transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
                      className="absolute inset-0 rounded-t-lg bg-gradient-to-t from-primary to-primary/70"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">
              {monthlyData.reduce((s, m) => s + m.count, 0)} depenses ce semestre
            </p>
          </>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Depenses par categorie" icon={PieChart} defaultOpen={false}>
        <div className="space-y-3">
          {categoryData.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Aucune donnee</p>
          )}
          {categoryData.map((cat, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{cat.emoji}</span>
                  <span className="text-xs font-medium">{cat.name}</span>
                </div>
                <span className="text-xs font-bold">{formatCurrency(cat.total, currency)}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(cat.total / maxCategory) * 100}%` }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{totalSpent > 0 ? ((cat.total / totalSpent) * 100).toFixed(1) : "0"}% du total</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Comparaison des membres" icon={Users} defaultOpen={false}>
        <div className="space-y-4">
          {memberData.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Aucune donnee</p>
          )}
          {memberData.map((m, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{m.name}</span>
                <div className="flex gap-3 text-[10px]">
                  <span className="text-primary">Paye: {formatCurrency(m.paid, currency)}</span>
                  <span className="text-destructive">Doit: {formatCurrency(m.owes, currency)}</span>
                </div>
              </div>
              <div className="flex gap-1 h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(m.paid / maxMember) * 100}%` }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="h-full rounded-full bg-primary"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(m.owes / maxMember) * 100}%` }}
                  transition={{ delay: i * 0.1 + 0.2, duration: 0.4 }}
                  className="h-full rounded-full bg-destructive/70"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 mt-4 pt-3 border-t border-border/30">
          <div className="text-center">
            <p className="text-lg font-bold text-primary">{formatCurrency(totalPaid, currency)}</p>
            <p className="text-[10px] text-muted-foreground">Total paye</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-destructive">{formatCurrency(totalOwed, currency)}</p>
            <p className="text-[10px] text-muted-foreground">Total du</p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Depenses par jour" icon={Calendar} defaultOpen={false}>
        {dayOfWeekData.every(d => d.total === 0) ? (
          <p className="text-xs text-muted-foreground text-center py-4">Aucune donnee</p>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {dayOfWeekData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">{d.total > 0 ? formatCurrency(d.total, currency) : ""}</span>
                <div className="w-full relative" style={{ height: `${Math.max((d.total / maxDay) * 100, 4)}%` }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "100%" }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="absolute inset-0 rounded-t-lg bg-gradient-to-t from-accent-foreground/30 to-accent-foreground/10"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Budget previsionnel" icon={Target} defaultOpen={false}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Budget mensuel</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={budget}
                onChange={e => setBudget(Number(e.target.value) || 0)}
                className="w-24 text-right text-sm font-bold bg-transparent border-b border-border/30 outline-none focus:border-primary transition-colors"
              />
              <span className="text-xs text-muted-foreground">MAD</span>
            </div>
          </div>
          {budget > 0 ? (
            <>
              <div className="h-4 rounded-full bg-secondary/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((totalSpent / budget) * 100, 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full ${totalSpent > budget ? "bg-destructive" : totalSpent > budget * 0.8 ? "bg-yellow-500" : "bg-primary"}`}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{formatCurrency(totalSpent, currency)} depenses</span>
                <span className={totalSpent > budget ? "text-destructive font-bold" : "text-muted-foreground"}>
                  {formatCurrency(Math.max(budget - totalSpent, 0), currency)} restant
                </span>
              </div>
              {totalSpent > budget && (
                <p className="text-xs text-destructive text-center font-medium">
                  Depassement de {formatCurrency(totalSpent - budget, currency)}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">Definissez un budget pour voir l&apos;analyse</p>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
});

AdvancedAnalytics.displayName = "AdvancedAnalytics";
