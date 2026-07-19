import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Download, FileText, Calendar, Users, TrendingUp, TrendingDown,
  BarChart3, PieChart as PieIcon, Filter, ChevronDown, Check, Printer,
  ArrowUpRight, ArrowDownLeft, Clock, Search,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";
import { AvatarImg } from "./AvatarImg";
import { formatCurrency } from "../utils/currency";

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

interface Member {
  id: string;
  name: string;
  avatar: string;
}

interface PendingPayment {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
  status: string;
  createdAt: number;
}

interface ReportsScreenProps {
  expenses: Expense[];
  members: Member[];
  pendingPayments: PendingPayment[];
  completedPayments: PendingPayment[];
  monthlyBudget: number;
  onBack: () => void;
}

type Period = "week" | "month" | "year" | "all";
type ReportView = "summary" | "comparison" | "monthly";

const PIE_COLORS = ["#34d399", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa", "#fb923c", "#2dd4bf", "#e879f9", "#f87171", "#4ade80"];

export function ReportsScreen({ expenses, members, pendingPayments, completedPayments, monthlyBudget, onBack }: ReportsScreenProps) {
  const [period, setPeriod] = useState<Period>("month");
  const [view, setView] = useState<ReportView>("summary");

  const fmt = formatCurrency;

  const periodStart = useMemo(() => {
    const d = new Date();
    if (period === "week") d.setDate(d.getDate() - 7);
    else if (period === "month") d.setMonth(d.getMonth() - 1);
    else if (period === "year") d.setFullYear(d.getFullYear() - 1);
    else return new Date(0);
    return d;
  }, [period]);

  const filtered = useMemo(() => expenses.filter(e => new Date(e.date) >= periodStart), [expenses, periodStart]);
  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const avg = filtered.length > 0 ? total / filtered.length : 0;

  const categoryData = useMemo(() => {
    const totals: Record<string, { value: number; emoji: string }> = {};
    filtered.forEach(e => {
      if (!totals[e.category]) totals[e.category] = { value: 0, emoji: e.categoryEmoji };
      totals[e.category].value += e.amount;
    });
    return Object.entries(totals)
      .map(([name, d]) => ({ name, value: Math.round(d.value * 100) / 100, emoji: d.emoji }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const memberData = useMemo(() => {
    const totals: Record<string, number> = {};
    filtered.forEach(e => { totals[e.payerId] = (totals[e.payerId] || 0) + e.amount; });
    return members.map(m => ({
      name: m.name, avatar: m.avatar,
      total: Math.round((totals[m.id] || 0) * 100) / 100,
    })).sort((a, b) => b.total - a.total);
  }, [filtered, members]);

  const monthlyHistory = useMemo(() => {
    const byMonth: Record<string, number> = {};
    expenses.forEach(e => {
      const key = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(new Date(e.date));
      byMonth[key] = (byMonth[key] || 0) + e.amount;
    });
    return Object.entries(byMonth)
      .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }))
      .slice(-12);
  }, [expenses]);

  const topSpender = memberData[0];
  const topCategory = categoryData[0];

  const handleExportPDF = () => {
    const lines: string[] = [
      "═══════════════════════════════════════",
      "     ÉQUILIBRA GROUPE - RAPPORT",
      "═══════════════════════════════════════",
      `Période: ${period === "all" ? "Tout" : period === "week" ? "7 jours" : period === "month" ? "1 mois" : "1 an"}`,
      `Date: ${new Date().toLocaleDateString("fr-FR")}`,
      "",
      "─── RÉSUMÉ ───",
      `Total dépensé: ${fmt(total)}`,
      `Nombre de dépenses: ${filtered.length}`,
      `Moyenne par dépense: ${fmt(avg)}`,
      "",
      "─── PAR CATÉGORIE ───",
      ...categoryData.map(c => `  ${c.emoji} ${c.name}: ${fmt(c.value)} (${total > 0 ? ((c.value / total) * 100).toFixed(0) : "0"}%)`),
      "",
      "─── PAR MEMBRE ───",
      ...memberData.map(m => `  ${m.name}: ${fmt(m.total)}`),
      "",
      "─── PAIEMENTS ───",
      `En attente: ${pendingPayments.filter(p => p.status === "pending").length}`,
      `Terminés: ${completedPayments.length}`,
      "",
      "═══════════════════════════════════════",
      "     Généré par Équilibra Groupe",
      "═══════════════════════════════════════",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `equilibra_rapport_${period}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const header = "Date,Description,Catégorie,Montant,Payer,Participants";
    const rows = filtered.map(e => {
      const payer = members.find(m => m.id === e.payerId);
      const parts = e.participants.map(id => members.find(m => m.id === id)?.name || id).join("+");
      return `${new Date(e.date).toISOString()},${e.description},${e.category},${e.amount},${payer?.name || e.payerId},${parts}`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `equilibra_depenses_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto px-5 pt-12 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}
          className="w-10 h-10 rounded-2xl bg-card/30 border border-border flex items-center justify-center">
          <ArrowLeft size={20} />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Rapports</h1>
          <p className="text-sm text-muted-foreground">Analyse de vos dépenses</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleExportPDF}
          className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
          <Download size={20} />
        </motion.button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 bg-card/30 border border-border rounded-2xl p-1">
        {([["week", "7j"], ["month", "1 mois"], ["year", "1 an"], ["all", "Tout"]] as [Period, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setPeriod(key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${period === key ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          ["summary", "Résumé", BarChart3],
          ["comparison", "Comparaison", Users],
          ["monthly", "Mensuel", Calendar],
        ] as [ReportView, string, any][]).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setView(key)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 ${view === key ? "bg-primary text-primary-foreground border-primary" : "bg-card/30 border-border text-muted-foreground"}`}>
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Summary View */}
        {view === "summary" && (
          <motion.div key="summary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            {/* Top Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card-enhanced rounded-[1.25rem] p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Total dépensé</p>
                <p className="text-xl font-bold mt-1">{fmt(total)}</p>
              </div>
              <div className="glass-card-enhanced rounded-[1.25rem] p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Moyenne</p>
                <p className="text-xl font-bold mt-1">{fmt(avg)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="glass-card-enhanced rounded-2xl p-3 text-center">
                <p className="text-lg font-bold">{filtered.length}</p>
                <p className="text-[10px] text-muted-foreground">Dépenses</p>
              </div>
              <div className="glass-card-enhanced rounded-2xl p-3 text-center">
                <p className="text-lg font-bold text-emerald-400">{completedPayments.length}</p>
                <p className="text-[10px] text-muted-foreground">Payés</p>
              </div>
              <div className="glass-card-enhanced rounded-2xl p-3 text-center">
                <p className="text-lg font-bold text-amber-400">{pendingPayments.filter(p => p.status === "pending").length}</p>
                <p className="text-[10px] text-muted-foreground">En attente</p>
              </div>
            </div>

            {/* Top Category */}
            {topCategory && (
              <div className="glass-card-enhanced rounded-[1.25rem] p-5 flex items-center gap-4">
                <span className="text-3xl">{topCategory.emoji}</span>
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Top catégorie</p>
                  <p className="text-sm font-bold">{topCategory.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{fmt(topCategory.value)}</p>
                  <p className="text-[10px] text-muted-foreground">{total > 0 ? ((topCategory.value / total) * 100).toFixed(0) : "0"}%</p>
                </div>
              </div>
            )}

            {/* Top Spender */}
            {topSpender && topSpender.total > 0 && (
              <div className="glass-card-enhanced rounded-[1.25rem] p-5 flex items-center gap-4">
                <AvatarImg avatar={topSpender.avatar} size="text-3xl" />
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Top dépensier</p>
                  <p className="text-sm font-bold">{topSpender.name}</p>
                </div>
                <p className="text-sm font-bold">{fmt(topSpender.total)}</p>
              </div>
            )}

            {/* Category Pie */}
            {categoryData.length > 0 && (
              <div className="glass-card-enhanced rounded-[1.25rem] p-5">
                <h3 className="text-sm font-semibold mb-4">Répartition par catégorie</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={72} paddingAngle={3} dataKey="value">
                        {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                        formatter={(value: number) => [fmt(value), "Montant"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {categoryData.map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-muted-foreground flex-1 truncate">{cat.emoji} {cat.name}</span>
                      <span className="text-xs font-semibold">{fmt(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Comparison View */}
        {view === "comparison" && (
          <motion.div key="comparison" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            {/* Bar Chart */}
            <div className="glass-card-enhanced rounded-[1.25rem] p-5">
              <h3 className="text-sm font-semibold mb-4">Dépenses par membre</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={memberData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                      formatter={(value: number) => [fmt(value), "Dépensé"]} />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {memberData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Member List */}
            <div className="glass-card-enhanced rounded-[1.25rem] overflow-hidden">
              {memberData.map((m, i) => (
                <div key={m.name} className={`flex items-center gap-3 p-4 hover:bg-card/50 transition-colors duration-200 ${i > 0 ? "border-t border-border" : ""}`}>
                  <AvatarImg avatar={m.avatar} size="text-xl" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {((m.total / (total || 1)) * 100).toFixed(0)}% du total
                    </p>
                  </div>
                  <p className="text-sm font-bold">{fmt(m.total)}</p>
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${(m.total / (memberData[0]?.total || 1)) * 100}%`,
                      backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Monthly View */}
        {view === "monthly" && (
          <motion.div key="monthly" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            <div className="glass-card-enhanced rounded-[1.25rem] p-5">
              <h3 className="text-sm font-semibold mb-4">Historique mensuel</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                      formatter={(value: number) => [fmt(value), "Total"]} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly List */}
            <div className="glass-card-enhanced rounded-[1.25rem] overflow-hidden">
              {monthlyHistory.map((m, i) => (
                <div key={m.month} className={`flex items-center gap-3 p-4 ${i > 0 ? "border-t border-border" : ""}`}>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar size={16} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold capitalize">{m.month}</p>
                  </div>
                  <p className="text-sm font-bold">{fmt(m.total)}</p>
                </div>
              ))}
            </div>

            {/* Budget */}
            {monthlyBudget > 0 && (
              <div className="glass-card-enhanced rounded-[1.25rem] p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Budget vs Réel</p>
                <div className="space-y-5">
                  {monthlyHistory.slice(-6).map(m => {
                    const pct = Math.min((m.total / monthlyBudget) * 100, 100);
                    return (
                      <div key={m.month}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium capitalize">{m.month}</span>
                          <span className={m.total > monthlyBudget ? "text-destructive font-semibold" : "text-muted-foreground"}>{fmt(m.total)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${m.total > monthlyBudget ? "bg-destructive" : m.total > monthlyBudget * 0.8 ? "bg-amber-500" : "bg-primary"}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleExportPDF}
          className="flex-1 py-3.5 rounded-2xl bg-card/30 border border-border text-sm font-semibold flex items-center justify-center gap-2">
          <FileText size={16} /> Exporter PDF
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleExportCSV}
          className="flex-1 py-3.5 rounded-2xl bg-card/30 border border-border text-sm font-semibold flex items-center justify-center gap-2">
          <Download size={16} /> Exporter CSV
        </motion.button>
      </div>

      <div className="h-8" />
    </motion.div>
  );
}
