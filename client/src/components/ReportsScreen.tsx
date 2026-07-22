import { useState, useMemo, useCallback } from "react";
import {
 ArrowLeft, Download, FileText, Calendar, Users,
 BarChart3, Check, Printer,
 ArrowUpRight, ArrowDownLeft,
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
 " ÉQUILIBRA GROUPE - RAPPORT",
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
 ...categoryData.map(c => ` ${c.emoji} ${c.name}: ${fmt(c.value)} (${total > 0 ? ((c.value / total) * 100).toFixed(0) : "0"}%)`),
 "",
 "─── PAR MEMBRE ───",
 ...memberData.map(m => ` ${m.name}: ${fmt(m.total)}`),
 "",
 "─── PAIEMENTS ───",
 `En attente: ${pendingPayments.filter(p => p.status === "pending").length}`,
 `Terminés: ${completedPayments.length}`,
 "",
 "═══════════════════════════════════════",
 " Généré par Équilibra Groupe",
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

 const handleExportCSV = useCallback(() => {
 if (!filtered.length) return;

 const sanitizeCSVCell = (val: string): string => {
 if (/^[=+\-@]/.test(val)) return `'${val}`;
 return val;
 };

 const BOM = "\uFEFF";
 const headers = ["Date", "Description", "Montant", "Devise", "Paye par", "Categorie", "Repartition"];

 const rows = filtered.map(e => {
 const payer = members.find(m => m.id === e.payerId);
 const splitType = e.participants.length > 1 ? "Partage" : "Individuel";
 const date = new Date(e.date).toLocaleDateString("fr-FR");

 return [
 date,
 `"${sanitizeCSVCell((e.description || "").replace(/"/g, '""'))}"`,
 e.amount.toFixed(2),
 "MAD",
 `"${sanitizeCSVCell(payer?.name || "Inconnu")}"`,
 `"${sanitizeCSVCell(`${e.categoryEmoji || ""} ${e.category || ""}`.trim())}"`,
 `${e.participants.length} personne(s)`,
 splitType,
 ].join(",");
 });

 const csv = BOM + headers.join(",") + "\n" + rows.join("\n");
 const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `equilibra-depenses-${new Date().toISOString().slice(0, 10)}.csv`;
 a.click();
 URL.revokeObjectURL(url);
 }, [filtered, members]);

 const handlePrint = useCallback(() => {
 const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
 const periodLabel = period === "all" ? "Tout" : period === "week" ? "7 jours" : period === "month" ? "1 mois" : "1 an";
 const now = new Date();
 const genDate = now.toLocaleDateString("fr-FR") + " a " + now.toLocaleTimeString("fr-FR");

 const rows = filtered.map(e => {
 const payer = members.find(m => m.id === e.payerId);
 return `<tr>
 <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${new Date(e.date).toLocaleDateString("fr-FR")}</td>
 <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${escHtml(e.description || "-")}</td>
 <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${escHtml(payer?.name || "-")}</td>
 <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${escHtml(e.category || "-")}</td>
 <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;font-weight:600">${e.amount.toFixed(2)} MAD</td>
 </tr>`;
 }).join("");

 const printHtml = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Equilibra - Rapport</title>
 <style>
 @page { size: A4; margin: 15mm; }
 @media print { .no-print { display: none !important; } }
 body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 0; margin: 0; }
 .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb; }
 .header h1 { font-size: 22px; margin: 0 0 4px 0; }
 .header p { font-size: 12px; color: #64748b; margin: 2px 0; }
 table { width: 100%; border-collapse: collapse; margin-top: 12px; }
 th { background: #f8fafc; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
 td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
 tr:nth-child(even) { background: #fafbfc; }
 .summary { display: flex; gap: 24px; margin: 16px 0; }
 .summary-box { flex: 1; padding: 12px 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
 .summary-box .label { font-size: 11px; color: #64748b; text-transform: uppercase; }
 .summary-box .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
 .footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #94a3b8; }
 </style></head><body>
 <div class="header">
 <h1>Equilibra Groupe</h1>
 <p>Rapport des depenses</p>
 <p>Periode: ${escHtml(periodLabel)} | Genere le ${escHtml(genDate)}</p>
 </div>
 <div class="summary">
 <div class="summary-box"><div class="label">Total</div><div class="value">${total.toFixed(2)} MAD</div></div>
 <div class="summary-box"><div class="label">Depenses</div><div class="value">${filtered.length}</div></div>
 <div class="summary-box"><div class="label">Moyenne</div><div class="value">${avg.toFixed(2)} MAD</div></div>
 <div class="summary-box"><div class="label">Membres</div><div class="value">${memberData.length}</div></div>
 </div>
 <table>
 <thead><tr><th>Date</th><th>Description</th><th>Paye par</th><th>Categorie</th><th style="text-align:right">Montant</th></tr></thead>
 <tbody>${rows}</tbody>
 </table>
 <div class="footer">Equilibra Groupe - Rapport genere le ${escHtml(genDate)}</div>
 <script>window.onload=function(){setTimeout(function(){window.print();},300);}<\/script>
 </body></html>`;

 const w = window.open("", "_blank");
 if (w) { w.document.write(printHtml); w.document.close(); }
 }, [filtered, members, total, avg, memberData.length, period]);

 return (
 <div className="max-w-md mx-auto px-5 pt-12 space-y-5">
 {/* Header */}
 <div className="flex items-center gap-3">
 <button onClick={onBack}
 className="w-10 h-10 rounded-2xl bg-card/30 border border-border flex items-center justify-center">
 <ArrowLeft size={20} />
 </button>
 <div className="flex-1">
 <h1 className="text-3xl font-bold tracking-tight">Rapports</h1>
 <p className="text-sm text-muted-foreground">Analyse de vos dépenses</p>
 </div>
 <button onClick={handleExportPDF}
 className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
 <Download size={20} />
 </button>
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

 
 {/* Summary View */}
 {view === "summary" && (
 <div key="summary" className="space-y-5">
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
 </div>
 )}

 {/* Comparison View */}
 {view === "comparison" && (
 <div key="comparison" className="space-y-5">
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
 </div>
 )}

 {/* Monthly View */}
 {view === "monthly" && (
 <div key="monthly" className="space-y-5">
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
 <div 
 className={`h-full rounded-full ${m.total > monthlyBudget ? "bg-destructive" : m.total > monthlyBudget * 0.8 ? "bg-amber-500" : "bg-primary"}`} />
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}
 </div>
 )}
 

 {/* Export Buttons */}
 <div className="flex gap-2">
 <button onClick={handleExportPDF}
 className="flex-1 py-3.5 rounded-2xl bg-card/30 border border-border text-sm font-semibold flex items-center justify-center gap-2">
 <FileText size={16} /> PDF
 </button>
 <button onClick={handleExportCSV}
 className="flex-1 py-3.5 rounded-2xl bg-card/30 border border-border text-sm font-semibold flex items-center justify-center gap-2">
 <Download size={16} /> CSV
 </button>
 <button onClick={handlePrint}
 className="flex-1 py-3.5 rounded-2xl bg-card/30 border border-border text-sm font-semibold flex items-center justify-center gap-2">
 <Printer size={16} /> Imprimer
 </button>
 </div>

 <div className="h-8" />
 </div>
 );
}
