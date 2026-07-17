import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { MemberSelect } from "../components/MemberSelect";
import type { Member, Expense, PendingPayment } from "../types";
import { formatCurrency } from "../utils/currency";
import { fadeUp } from "../constants";
import { AvatarImg } from "../components/AvatarImg";

export function StatsTab({ expenses, members, currentMemberId, pendingPayments, completedPayments, monthlyBudget }: {
  expenses: Expense[];
  members: Member[];
  currentMemberId: string;
  pendingPayments: PendingPayment[];
  completedPayments: PendingPayment[];
  monthlyBudget: number;
}) {
  type Period = "week" | "month" | "year" | "all";
  const [period, setPeriod] = useState<Period>("month");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const now = new Date();
  const periodStart = useMemo(() => {
    const d = new Date(now);
    if (period === "week") d.setDate(d.getDate() - 7);
    else if (period === "month") d.setMonth(d.getMonth() - 1);
    else if (period === "year") d.setFullYear(d.getFullYear() - 1);
    else return new Date(0);
    return d;
  }, [period]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => new Date(e.date) >= periodStart);
  }, [expenses, periodStart]);

  const prevPeriodStart = useMemo(() => {
    const d = new Date(periodStart);
    const diff = now.getTime() - periodStart.getTime();
    d.setTime(d.getTime() - diff);
    return d;
  }, [periodStart]);

  const prevExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d >= prevPeriodStart && d < periodStart;
    });
  }, [expenses, periodStart, prevPeriodStart]);

  const currentTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);
  const trend = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;

  const memberExpenses = useMemo(() => {
    if (!selectedMember) return filteredExpenses;
    return filteredExpenses.filter(e => e.payerId === selectedMember || e.participants.includes(selectedMember));
  }, [filteredExpenses, selectedMember]);

  const memberPrevExpenses = useMemo(() => {
    if (!selectedMember) return prevExpenses;
    return prevExpenses.filter(e => e.payerId === selectedMember || e.participants.includes(selectedMember));
  }, [prevExpenses, selectedMember]);

  const memberCurrentTotal = memberExpenses.reduce((s, e) => s + e.amount, 0);
  const memberPrevTotal = memberPrevExpenses.reduce((s, e) => s + e.amount, 0);
  const memberTrend = memberPrevTotal > 0 ? ((memberCurrentTotal - memberPrevTotal) / memberPrevTotal) * 100 : 0;

  const categoryData = useMemo(() => {
    const totals: Record<string, { value: number; emoji: string }> = {};
    memberExpenses.forEach(e => {
      if (!totals[e.category]) totals[e.category] = { value: 0, emoji: e.categoryEmoji };
      totals[e.category].value += e.amount;
    });
    return Object.entries(totals)
      .map(([name, d]) => ({ name, value: Math.round(d.value * 100) / 100, emoji: d.emoji }))
      .sort((a, b) => b.value - a.value);
  }, [memberExpenses]);

  const memberBarData = useMemo(() => {
    const totals: Record<string, number> = {};
    memberExpenses.forEach(e => { totals[e.payerId] = (totals[e.payerId] || 0) + e.amount; });
    return members.map(m => ({
      name: m.name,
      avatar: m.avatar,
      total: Math.round((totals[m.id] || 0) * 100) / 100,
    }));
  }, [memberExpenses, members]);

  const trendData = useMemo(() => {
    const byDay: Record<string, number> = {};
    memberExpenses.forEach(e => {
      const day = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(new Date(e.date));
      byDay[day] = (byDay[day] || 0) + e.amount;
    });
    return Object.entries(byDay)
      .map(([date, total]) => ({ date, total: Math.round(total * 100) / 100 }))
      .slice(-14);
  }, [memberExpenses]);

  const monthlyData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    memberExpenses.forEach(e => {
      const month = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(new Date(e.date));
      byMonth[month] = (byMonth[month] || 0) + e.amount;
    });
    return Object.entries(byMonth)
      .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }))
      .slice(-8);
  }, [memberExpenses]);

  const pieColors = ["#34d399", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa", "#fb923c", "#2dd4bf", "#e879f9", "#f87171", "#4ade80"];

  const averagePerPerson = members.length > 0 ? memberCurrentTotal / members.length : 0;
  const topCategory = categoryData[0] || null;
  const biggestSpender = memberBarData.sort((a, b) => b.total - a.total)[0] || null;
  const budgetUsed = monthlyBudget > 0 ? (currentTotal / monthlyBudget) * 100 : 0;
  const currentMonthTotal = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, e) => s + e.amount, 0);

  const totalPayments = pendingPayments.length + completedPayments.length;
  const completedCount = completedPayments.length;
  const pendingCount = pendingPayments.filter(p => p.status === "pending").length;
  const disputedCount = pendingPayments.filter(p => p.status === "disputed").length;

  return (
    <motion.div {...fadeUp} className="max-w-md mx-auto px-5 pt-12 space-y-5">
      <div className="pointer-events-none absolute -top-20 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute top-64 -left-28 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

      <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-card-enhanced relative overflow-hidden rounded-[1.25rem] p-6">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              <BarChart3 size={12} />
              Tableau de bord
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Statistiques</h1>
            <p className="mt-1 text-sm text-muted-foreground">Analyse complète de vos dépenses</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-primary to-violet-500 text-white shadow-lg shadow-primary/25">
            <BarChart3 size={22} />
          </div>
        </div>
      </motion.header>

      {/* Period Selector */}
      <div className="flex gap-2 bg-card/30 border border-border rounded-2xl p-1">
        {([["week", "Semaine"], ["month", "Mois"], ["year", "Année"], ["all", "Tout"]] as [Period, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setPeriod(key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${period === key ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Member Filter */}
      <div className="flex gap-2 items-center">
        <MemberSelect
          members={members}
          selected={selectedMember}
          onChange={setSelectedMember}
          allLabel="Tout le groupe"
          className="flex-1"
        />
      </div>

      {memberExpenses.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <div className="text-5xl mb-4">📊</div>
          <p>Aucune dépense pour cette période</p>
        </div>
      ) : (
        <>
          {/* Main Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card-enhanced rounded-[1.25rem] p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Total</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(memberCurrentTotal)}</p>
              {trend !== 0 && (
                <p className={`text-[10px] font-semibold mt-1 flex items-center gap-1 ${trend > 0 ? "text-red-400" : "text-green-400"}`}>
                  {trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {Math.abs(trend).toFixed(0)}% vs période préc.
                </p>
              )}
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }} className="glass-card-enhanced rounded-[1.25rem] p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Moyenne/personne</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(averagePerPerson)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{memberExpenses.length} dépenses</p>
            </motion.div>
          </div>

          {/* Budget Tracker */}
          {monthlyBudget > 0 && !selectedMember && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card-enhanced rounded-[1.25rem] p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Budget mensuel</p>
                <p className="text-sm font-bold">{formatCurrency(currentMonthTotal)} / {formatCurrency(monthlyBudget)}</p>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(budgetUsed, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${budgetUsed > 100 ? "bg-red-500" : budgetUsed > 80 ? "bg-yellow-500" : "bg-primary"}`} />
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-[10px] text-muted-foreground">{budgetUsed.toFixed(0)}% utilisé</p>
                <p className={`text-[10px] font-semibold ${budgetUsed > 100 ? "text-red-400" : "text-muted-foreground"}`}>
                  {budgetUsed > 100 ? `Dépassé de ${formatCurrency(currentMonthTotal - monthlyBudget)}` : `Reste ${formatCurrency(monthlyBudget - currentMonthTotal)}`}
                </p>
              </div>
            </motion.div>
          )}

          {/* Key Metrics Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="glass-card-enhanced rounded-2xl p-3 text-center">
              <p className="text-lg font-bold">{totalPayments}</p>
              <p className="text-[10px] text-muted-foreground">Paiements</p>
            </div>
            <div className="glass-card-enhanced rounded-2xl p-3 text-center">
              <p className="text-lg font-bold text-green-400">{completedCount}</p>
              <p className="text-[10px] text-muted-foreground">Confirmés</p>
            </div>
            <div className="glass-card-enhanced rounded-2xl p-3 text-center">
              <p className="text-lg font-bold text-orange-400">{pendingCount}</p>
              <p className="text-[10px] text-muted-foreground">En attente</p>
            </div>
          </div>

          {/* Top Category */}
          {topCategory && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="glass-card-enhanced relative overflow-hidden rounded-[1.25rem] border-primary/20 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{topCategory.emoji}</span>
                  <div>
                    <p className="text-xs text-primary font-semibold uppercase tracking-wide">Catégorie principale</p>
                    <p className="text-lg font-bold mt-0.5">{topCategory.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{formatCurrency(topCategory.value)}</p>
                  <p className="text-[10px] text-muted-foreground">{((topCategory.value / memberCurrentTotal) * 100).toFixed(0)}% du total</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Biggest Spender */}
          {biggestSpender && biggestSpender.total > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              className="glass-card-enhanced rounded-[1.25rem] p-4 flex items-center gap-4">
              <AvatarImg avatar={biggestSpender.avatar} size="text-3xl" />
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Plus gros dépensier</p>
                <p className="text-sm font-bold">{biggestSpender.name}</p>
              </div>
              <p className="text-lg font-bold">{formatCurrency(biggestSpender.total)}</p>
            </motion.div>
          )}

          {/* Pie Chart - By Category */}
          {categoryData.length > 0 && (
            <div className="glass-card-enhanced relative overflow-hidden rounded-[1.25rem] p-5">
              <h3 className="text-sm font-semibold mb-4">Répartition par catégorie</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={78} paddingAngle={3} dataKey="value">
                      {categoryData.map((_, i) => <Cell key={`c-${i}`} fill={pieColors[i % pieColors.length]} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                      formatter={(value: number) => [formatCurrency(value), "Montant"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {categoryData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                    <span className="text-xs text-muted-foreground flex-1 truncate">{cat.emoji} {cat.name}</span>
                    <span className="text-xs font-semibold">{formatCurrency(cat.value)}</span>
                    <span className="text-[10px] text-muted-foreground w-10 text-right">{((cat.value / memberCurrentTotal) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bar Chart - By Member */}
          <div className="glass-card-enhanced relative overflow-hidden rounded-[1.25rem] p-5">
            <h3 className="text-sm font-semibold mb-4">Dépenses par membre</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberBarData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                    formatter={(value: number) => [formatCurrency(value), "Dépensé"]} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {memberBarData.map((_, i) => <Cell key={`m-${i}`} fill={pieColors[i % pieColors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trend Line */}
          {trendData.length > 1 && (
            <div className="glass-card-enhanced relative overflow-hidden rounded-[1.25rem] p-5">
              <h3 className="text-sm font-semibold mb-4">Évolution quotidienne</h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                      formatter={(value: number) => [formatCurrency(value), "Total"]} />
                    <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2.5}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: "hsl(var(--primary))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Monthly Breakdown */}
          {monthlyData.length > 1 && (
            <div className="glass-card-enhanced relative overflow-hidden rounded-[1.25rem] p-5">
              <h3 className="text-sm font-semibold mb-4">Historique mensuel</h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                      formatter={(value: number) => [formatCurrency(value), "Total"]} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      <div className="h-8" />
    </motion.div>
  );
}
