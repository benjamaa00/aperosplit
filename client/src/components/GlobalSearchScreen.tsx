import { memo, useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Search, X, Clock, ArrowUpRight, DollarSign, Users, Tag } from "lucide-react";
import { formatCurrency } from "../utils/currency";
import type { Expense, Member, GroupCategory } from "../types";
function normalize(s: string): string {
 return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function Highlight({ text, query }: { text: string; query: string }) {
 if (!query.trim()) return <>{text}</>;
 const nq = normalize(query);
 const nt = normalize(text);
 const idx = nt.indexOf(nq);
 if (idx === -1) return <>{text}</>;
 return (
 <>
 {text.slice(0, idx)}
 <mark className="bg-primary/20 text-primary rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
 {text.slice(idx + query.length)}
 </>
 );
}

const SEARCH_HISTORY_KEY = "equilibra_search_history";
const MAX_HISTORY = 8;

function getSearchHistory(): string[] {
 try { return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveSearchHistory(term: string) {
 if (!term.trim()) return;
 const history = getSearchHistory().filter(h => h.toLowerCase() !== term.toLowerCase());
 history.unshift(term);
 if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
 try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history)); } catch {}
}
function clearSearchHistory() {
 try { localStorage.removeItem(SEARCH_HISTORY_KEY); } catch {}
}

interface GlobalSearchScreenProps {
 isOpen: boolean;
 onClose: () => void;
 expenses: Expense[];
 members: Member[];
 categories: GroupCategory[];
 onExpenseClick: (expense: Expense) => void;
}

export const GlobalSearchScreen = memo(function GlobalSearchScreen({
 isOpen, onClose, expenses, members, categories, onExpenseClick,
}: GlobalSearchScreenProps) {
 const [query, setQuery] = useState("");
 const [history, setHistory] = useState<string[]>(getSearchHistory);
 const inputRef = useRef<HTMLInputElement>(null);

 useEffect(() => {
 if (isOpen) {
 setTimeout(() => inputRef.current?.focus(), 100);
 setHistory(getSearchHistory());
 } else {
 setQuery("");
 }
 }, [isOpen]);

 const results = useMemo(() => {
 if (!query.trim()) return { expenses: [], members: [], categories: [] };
 const q = normalize(query);
 const isAmount = /^\d+([.,]\d+)?$/.test(q.trim());
 const isDate = /\d{1,2}[\/\-]\d{1,2}/.test(q);

 const matchedExpenses = expenses.filter(e => {
 if (normalize(e.description || "").includes(q)) return true;
 if (isAmount) {
 const amount = parseFloat(q.replace(",", "."));
 if (Math.abs(e.amount - amount) < 0.01) return true;
 if (e.amount.toString().includes(q.replace(",", "."))) return true;
 }
 if (isDate) {
 const d = new Date(e.date);
 const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
 if (dateStr.includes(q)) return true;
 const fullDate = d.toLocaleDateString("fr-FR");
 if (fullDate.includes(q)) return true;
 }
 const catMatch = categories.find(c => normalize(c.name).includes(q) || c.subcategories?.some((s: any) => normalize(s.name || "").includes(q)));
 if (catMatch) return true;
 const payer = members.find(m => m.id === e.payerId);
 if (payer && normalize(payer.name).includes(q)) return true;
 return false;
 }).slice(0, 20);

 const matchedMembers = members.filter(m => normalize(m.name).includes(q)).slice(0, 5);

 const matchedCategories = categories.filter(c => normalize(c.name).includes(q) || c.subcategories?.some((s: any) => normalize(s.name || "").includes(q))).slice(0, 5);

 return { expenses: matchedExpenses, members: matchedMembers, categories: matchedCategories };
 }, [query, expenses, members, categories]);

 const totalResults = results.expenses.length + results.members.length + results.categories.length;
 const hasQuery = query.trim().length > 0;

 const handleSelectHistory = useCallback((term: string) => {
 setQuery(term);
 saveSearchHistory(term);
 setHistory(getSearchHistory());
 }, []);

 const handleSubmit = useCallback(() => {
 if (query.trim()) {
 saveSearchHistory(query.trim());
 setHistory(getSearchHistory());
 }
 }, [query]);

 const handleClearHistory = useCallback(() => {
 clearSearchHistory();
 setHistory([]);
 }, []);

 return (
 
 {isOpen && (
 <div
 initial={{ opacity: 0 }}
 
 
 
 className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl"
 style={{ WebkitBackdropFilter: "blur(20px)" }}
 >
 <div className="flex flex-col h-full max-w-md mx-auto">
 <div className="sticky top-0 z-10 px-5 pt-12 pb-3 bg-background/80 backdrop-blur-xl border-b border-border/30">
 <div className="flex items-center gap-3">
 <div className="flex-1 flex items-center gap-3 bg-card/50 backdrop-blur-sm border border-border rounded-2xl px-4 py-3">
 <Search size={18} className="text-muted-foreground shrink-0" />
 <input
 ref={inputRef}
 value={query}
 onChange={e => setQuery(e.target.value)}
 onKeyDown={e => e.key === "Enter" && handleSubmit()}
 placeholder="Rechercher depenses, membres, categories..."
 className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/50"
 autoComplete="off"
 autoCorrect="off"
 spellCheck={false}
 />
 {query && (
 <button onClick={() => setQuery("")} className="p-1 rounded-lg hover:bg-secondary/50">
 <X size={16} className="text-muted-foreground" />
 </button>
 )}
 </div>
 <button onClick={onClose} className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
 Annuler
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto scrollbar-hidden px-5 pb-8">
 {!hasQuery && history.length > 0 && (
 <div className="mt-4">
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recherches recentes</h3>
 <button onClick={handleClearHistory} className="text-xs text-primary hover:underline">Effacer tout</button>
 </div>
 <div className="space-y-1">
 {history.map((term, i) => (
 <div key={i} className="flex items-center gap-2">
 <button
 onClick={() => handleSelectHistory(term)}
 className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-card/50 transition-colors text-left"
 >
 <Clock size={14} className="text-muted-foreground shrink-0" />
 <span className="text-sm">{term}</span>
 </button>
 <button
 onClick={(ev) => {
 ev.stopPropagation();
 const newHistory = history.filter((_, idx) => idx !== i);
 setHistory(newHistory);
 try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory)); } catch {}
 }}
 className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors shrink-0"
 >
 <X size={12} className="text-muted-foreground" />
 </button>
 </div>
 ))}
 </div>
 </div>
 )}

 {!hasQuery && history.length === 0 && (
 <div className="mt-12 text-center space-y-4">
 <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
 <Search size={28} className="text-primary/40" />
 </div>
 <div>
 <p className="text-sm font-medium">Recherche globale</p>
 <p className="text-xs text-muted-foreground mt-1">Par depense, montant, date, membre ou categorie</p>
 </div>
 <div className="flex flex-wrap justify-center gap-2 mt-4">
 {["Restaurant", "250", "Ahmed", "Transport", "15/03"].map(hint => (
 <button key={hint} onClick={() => handleSelectHistory(hint)} className="px-3 py-1.5 rounded-full bg-card/50 border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
 {hint}
 </button>
 ))}
 </div>
 </div>
 )}

 {hasQuery && totalResults === 0 && (
 <div className="mt-12 text-center">
 <p className="text-sm text-muted-foreground">Aucun resultat pour &quot;{query}&quot;</p>
 </div>
 )}

 {hasQuery && results.categories.length > 0 && (
 <div className="mt-4">
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
 <Tag size={12} /> Categories ({results.categories.length})
 </h3>
 <div className="space-y-1">
 {results.categories.map(cat => (
 <div key={cat.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card/30">
 <span className="text-lg">{cat.emoji || "📦"}</span>
 <span className="text-sm font-medium"><Highlight text={cat.name} query={query} /></span>
 </div>
 ))}
 </div>
 </div>
 )}

 {hasQuery && results.members.length > 0 && (
 <div className="mt-4">
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
 <Users size={12} /> Membres ({results.members.length})
 </h3>
 <div className="space-y-1">
 {results.members.map(m => (
 <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card/30">
 <span className="text-sm font-medium"><Highlight text={m.name} query={query} /></span>
 {m.role === "admin" && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Admin</span>}
 </div>
 ))}
 </div>
 </div>
 )}

 {hasQuery && results.expenses.length > 0 && (
 <div className="mt-4">
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
 <DollarSign size={12} /> Depenses ({results.expenses.length})
 </h3>
 <div className="space-y-2">
 {results.expenses.map(exp => (
 <button
 key={exp.id}
 onClick={() => { saveSearchHistory(query.trim()); onExpenseClick(exp); onClose(); }}
 className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-card/30 hover:bg-card/50 transition-colors text-left"
 >
 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
 <span className="text-lg">{exp.categoryEmoji || "📦"}</span>
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium truncate"><Highlight text={exp.description || "Sans description"} query={query} /></p>
 <p className="text-xs text-muted-foreground">{new Date(exp.date).toLocaleDateString("fr-FR")}</p>
 </div>
 <div className="text-right shrink-0">
 <p className="text-sm font-bold">{formatCurrency(exp.amount)}</p>
 </div>
 <ArrowUpRight size={14} className="text-muted-foreground shrink-0" />
 </button>
 ))}
 </div>
 </div>
 )}

 {hasQuery && totalResults > 0 && (
 <p className="text-center text-xs text-muted-foreground mt-6">{totalResults} resultat{totalResults > 1 ? "s" : ""}</p>
 )}
 </div>
 </div>
 </div>
 )}
 
 );
});

GlobalSearchScreen.displayName = "GlobalSearchScreen";
