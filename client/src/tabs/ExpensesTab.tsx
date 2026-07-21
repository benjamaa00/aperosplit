import { memo, useState, useRef, useCallback, useEffect } from "react";
import {
 Plus,
 Trash2,
 Send,
 Users,
 UserCheck,
 Search,
 X,
 Receipt,
 Copy,
 MoreVertical,
 Pencil,
} from "lucide-react";
import { toast } from "sonner";
import type { Member, Expense, GroupCategory } from "../types";
import { formatCurrency, formatDate } from "../utils/currency";
import { AvatarImg } from "../components/AvatarImg";
import { EmptyState } from "../components/EmptyState";
import { GlobalSearchScreen } from "../components/GlobalSearchScreen";

type ModalState =
 | { type: null }
 | {
 type: "group";
 expenseId: string;
 participants: string[];
 selectedIds: string[];
 note: string;
 }
 | {
 type: "individual";
 expenseId: string;
 participants: string[];
 selectedId: string | null;
 perPerson: number;
 note: string;
 }
 | {
 type: "reimbursement";
 expenseId: string;
 toId: string;
 perPerson: number;
 note: string;
 };

export const ExpensesTab = memo(function ExpensesTab({
 expenses,
 members,
 currentMemberId,
 onDelete,
 onAdd,
 onDuplicate,
 onRequestPayment,
 onRequestGroupPayment,
 currency,
 pendingPayments,
 completedPayments,
 categories,
}: {
 expenses: Expense[];
 members: Member[];
 currentMemberId: string;
 onDelete: (id: string) => void;
 onAdd: () => void;
 onDuplicate: (expense: Expense) => void;
 onRequestPayment: (
 toId: string,
 amount: number,
 expenseId?: string,
 note?: string
 ) => void;
 onRequestGroupPayment: (
 expenseId: string,
 participantIds?: string[],
 note?: string
 ) => void;
 currency: string;
 pendingPayments: Array<{ id: string; expenseId?: string; toId: string; fromId: string; amount: number; status: string }>;
 completedPayments: Array<{ id: string; expenseId?: string; toId: string; fromId: string; amount: number; status: string }>;
 categories: GroupCategory[];
}) {
 const [search, setSearch] = useState("");
 const [modal, setModal] = useState<ModalState>({ type: null });
 const [showGlobalSearch, setShowGlobalSearch] = useState(false);
 const [openMenuId, setOpenMenuId] = useState<string | null>(null);

 const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

 const filtered = expenses
 .filter((e) =>
 e.description.toLowerCase().includes(search.toLowerCase())
 )
 .sort((a, b) => b.date - a.date);

 useEffect(() => {
 if (!openMenuId) return;
 const handler = () => setOpenMenuId(null);
 document.addEventListener("click", handler);
 return () => document.removeEventListener("click", handler);
 }, [openMenuId]);

 useEffect(() => {
 return () => {
 pendingDeletes.current.forEach((t) => clearTimeout(t));
 };
 }, []);

 const close = () => setModal({ type: null });

 const handleDeleteWithUndo = useCallback((expenseId: string) => {
 const timer = setTimeout(() => {
 onDelete(expenseId);
 pendingDeletes.current.delete(expenseId);
 }, 5000);
 pendingDeletes.current.set(expenseId, timer);

 toast("Depense supprimee", {
 description: "Appuyez sur Annuler pour restaurer",
 action: {
 label: "Annuler",
 onClick: () => {
 const t = pendingDeletes.current.get(expenseId);
 if (t) { clearTimeout(t); pendingDeletes.current.delete(expenseId); }
 toast.success("Depense restauree");
 },
 },
 duration: 5000,
 });
 }, [onDelete]);

 const openGroupModal = (exp: Expense) => {
 const otherIds = exp.participants.filter(
 (pid) => pid !== currentMemberId
 );
 setModal({
 type: "group",
 expenseId: exp.id,
 participants: otherIds,
 selectedIds: [...otherIds],
 note: "",
 });
 };

 const openIndividualModal = (exp: Expense) => {
 const otherIds = exp.participants.filter(
 (pid) => pid !== currentMemberId
 );
 setModal({
 type: "individual",
 expenseId: exp.id,
 participants: otherIds,
 selectedId: null,
 perPerson: exp.amount / (exp.participants.length || 1),
 note: "",
 });
 };

 const openReimbursementModal = (exp: Expense) => {
 const otherId = exp.participants.find(
 (pid) => pid !== currentMemberId
 );
 if (!otherId) return;
 setModal({
 type: "reimbursement",
 expenseId: exp.id,
 toId: otherId,
 perPerson: exp.amount / (exp.participants.length || 1),
 note: "",
 });
 };

 const handleGroupConfirm = () => {
 if (modal.type !== "group") return;
 onRequestGroupPayment(
 modal.expenseId,
 modal.selectedIds,
 modal.note || undefined
 );
 close();
 };

 const handleIndividualConfirm = () => {
 if (modal.type !== "individual" || !modal.selectedId) return;
 onRequestPayment(
 modal.selectedId,
 modal.perPerson,
 modal.expenseId,
 modal.note || undefined
 );
 close();
 };

 const handleReimbursementConfirm = () => {
 if (modal.type !== "reimbursement") return;
 onRequestPayment(
 modal.toId,
 modal.perPerson,
 modal.expenseId,
 modal.note || undefined
 );
 close();
 };

 const toggleGroupParticipant = (id: string) => {
 if (modal.type !== "group") return;
 setModal({
 ...modal,
 selectedIds: modal.selectedIds.includes(id)
 ? modal.selectedIds.filter((sid) => sid !== id)
 : [...modal.selectedIds, id],
 });
 };

 const getMember = (id: string) =>
 members.find((m) => m.id === id);

 return (
 <>
 <div
 
 className="max-w-md mx-auto px-5 pt-16 space-y-5 overflow-y-auto pb-32 scrollbar-hidden"
 >
 <div className="flex items-center justify-between">
 <h1 className="text-2xl font-bold tracking-tight">Dépenses</h1>
 <button
 onClick={onAdd}
 className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30"
 >
 <Plus size={20} />
 </button>
 </div>

 <button
 onClick={() => setShowGlobalSearch(true)}
 className="w-full flex items-center gap-3 px-4 py-3 bg-card/50 backdrop-blur-sm border border-border rounded-2xl text-sm text-muted-foreground"
 >
 <Search size={16} />
 Rechercher...
 </button>

 <div className="relative">
 <Search
 size={16}
 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60"
 />
 <input
 type="text"
 placeholder="Filtrer les depenses..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full bg-card/50 backdrop-blur-sm border border-border rounded-2xl pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20 transition-all"
 />
 </div>

 <div className="space-y-3">
 {filtered.length === 0 ? (
 <EmptyState
 icon={Receipt}
 title="Aucune depense"
 description="Ajoutez votre premiere depense pour commencer a suivre les finances du groupe."
 action={{ label: "Ajouter une depense", onClick: () => onAdd() }}
 />
 ) : (
 filtered.map((exp, i) => {
 const payer = getMember(exp.payerId);
 const perPerson = exp.amount / (exp.participants.length || 1);
 const userShare = exp.participants.includes(currentMemberId)
 ? perPerson
 : 0;
 const otherParticipants = exp.participants.filter(
 (pid) => pid !== currentMemberId
 );
 const shownAvatars = exp.participants.slice(0, 4);
 const extraCount = exp.participants.length - 4;
 const isPayer = exp.payerId === currentMemberId;
 const isReimbursementCase =
 isPayer &&
 exp.participants.length === 1 &&
 otherParticipants.length === 1;

 const cat = categories.find(c => c.name === exp.category);
 const emoji = cat?.emoji || exp.categoryEmoji || "📦";

 const expensePayments = pendingPayments.filter((p: { expenseId?: string }) => p.expenseId === exp.id);
 const expenseCompletedPayments = completedPayments.filter((p: { expenseId?: string }) => p.expenseId === exp.id);
 const totalParticipantsExceptPayer = exp.participants.filter(pid => pid !== exp.payerId).length;
 const paidCount = expenseCompletedPayments.filter((p: { status: string }) =>
 p.status === "completed" || p.status === "paid"
 ).length;
 const pendingCount = expensePayments.filter((p: { status: string }) =>
 p.status === "pending" || p.status === "late" || p.status === "accepted"
 ).length;
 const refusedCount = expensePayments.filter((p: { status: string }) =>
 p.status === "refused" || p.status === "disputed"
 ).length;
 const hasPayments = expensePayments.length > 0 || expenseCompletedPayments.length > 0;
 const canModify = isPayer || getMember(currentMemberId)?.role === "admin";

 return (
 <div
 key={exp.id}
 
 
 
 className="glass-card-enhanced rounded-[1.25rem] p-4 hover:bg-card/60 transition-colors duration-200"
 >
 <div className="flex items-start gap-3 mb-3">
 <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center text-xl shrink-0">
 {emoji}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold truncate">
 {exp.description}
 </p>
 <p className="text-xs text-muted-foreground mt-0.5">
 {cat?.name || exp.category} · {formatDate(exp.date)}
 </p>
 </div>
 <div className="text-right shrink-0 flex items-start gap-1">
 <p className="text-base font-bold">
 {formatCurrency(exp.amount, currency)}
 </p>
 <div className="relative">
 <button
 onClick={(e) => {
 e.stopPropagation();
 setOpenMenuId(openMenuId === exp.id ? null : exp.id);
 }}
 className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
 >
 <MoreVertical size={13} />
 </button>
 
 {openMenuId === exp.id && (
 <div
 initial={{ opacity: 0, scale: 0.9, y: -4 }}
 
 
 
 className="absolute right-0 top-8 z-50 min-w-[160px] bg-card border border-border rounded-xl shadow-xl overflow-hidden"
 onClick={(e) => e.stopPropagation()}
 >
 <button
 onClick={() => {
 setOpenMenuId(null);
 onDuplicate(exp);
 }}
 className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-muted/50 transition-colors"
 >
 <Copy size={14} className="text-muted-foreground" />
 Dupliquer
 </button>
 {canModify && (
 <button
 onClick={() => {
 setOpenMenuId(null);
 onDuplicate(exp);
 }}
 className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-muted/50 transition-colors"
 >
 <Pencil size={14} className="text-muted-foreground" />
 Modifier
 </button>
 )}
 {canModify && (
 <>
 <div className="h-px bg-border" />
 <button
 onClick={() => {
 setOpenMenuId(null);
 handleDeleteWithUndo(exp.id);
 }}
 className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
 >
 <Trash2 size={14} />
 Supprimer
 </button>
 </>
 )}
 </div>
 )}
 
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2 mb-3 px-1">
 <AvatarImg
 avatar={payer?.avatar ?? ""}
 size="text-xs"
 />
 <span className="text-xs text-muted-foreground">
 Payé par{" "}
 <span className="text-foreground font-medium">
 {payer?.name}
 </span>
 </span>
 </div>

 {isPayer && totalParticipantsExceptPayer > 0 && (
 <div className="mb-2">
 {paidCount >= totalParticipantsExceptPayer ? (
 <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full">
 ✓ Tout payé
 </span>
 ) : hasPayments ? (
 <div className="flex items-center gap-2 flex-wrap">
 <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full">
 {paidCount}/{totalParticipantsExceptPayer} payé{paidCount > 1 ? "s" : ""}
 </span>
 {pendingCount > 0 && (
 <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full">
 {pendingCount} en attente
 </span>
 )}
 {refusedCount > 0 && (
 <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-500/10 text-red-400 px-2.5 py-1 rounded-full">
 {refusedCount} refusé{refusedCount > 1 ? "s" : ""}
 </span>
 )}
 </div>
 ) : null}
 </div>
 )}

 <div className="bg-background/30 rounded-xl p-3 space-y-2 mb-3">
 <div className="flex items-center justify-between text-xs">
 <span className="text-muted-foreground">
 Part par personne
 </span>
 <span className="font-semibold">
 {formatCurrency(perPerson, currency)}
 </span>
 </div>
 {exp.participants.includes(currentMemberId) &&
 !isPayer && (
 <div className="flex items-center justify-between text-xs bg-primary/10 rounded-lg p-2 -mx-2">
 <span className="text-primary font-medium">
 Votre part
 </span>
 <span className="font-bold text-primary">
 {formatCurrency(userShare, currency)}
 </span>
 </div>
 )}
 </div>

 <div className="flex items-center gap-1.5 mb-3">
 {shownAvatars.map((pid) => {
 const member = getMember(pid);
 return (
 <div
 key={pid}
 className="w-7 h-7 rounded-full border-2 border-background overflow-hidden -ml-1 first:ml-0"
 >
 <AvatarImg
 avatar={member?.avatar ?? ""}
 size="text-sm"
 />
 </div>
 );
 })}
 {extraCount > 0 && (
 <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center -ml-1 text-[10px] font-semibold text-muted-foreground">
 +{extraCount}
 </div>
 )}
 <span className="text-[11px] text-muted-foreground ml-1">
 {exp.participants.length} participant
 {exp.participants.length > 1 ? "s" : ""}
 </span>
 </div>

 <div className="flex items-center justify-between pt-3 border-t border-border">
 <div className="flex items-center gap-2">
 {isPayer && (
 <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium">
 Vous avez payé
 </span>
 )}
 {exp.participants.includes(currentMemberId) &&
 !isPayer && (
 <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full font-medium">
 Vous devez{" "}
 {formatCurrency(userShare, currency)}
 </span>
 )}
 </div>
 <div className="flex items-center gap-1.5">
 {isPayer &&
 otherParticipants.length > 1 && (
 <button
 onClick={() =>
 openGroupModal(exp)
 }
 className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-sm"
 >
 <Users size={12} />
 Demander à tous
 </button>
 )}
 {isPayer &&
 otherParticipants.length > 1 && (
 <button
 onClick={() =>
 openIndividualModal(exp)
 }
 className="bg-primary/15 text-primary px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1"
 >
 <UserCheck size={12} />
 Individuel
 </button>
 )}
 {isReimbursementCase && (
 <button
 onClick={() =>
 openReimbursementModal(exp)
 }
 className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-sm"
 >
 <Send size={12} />
 Demander remboursement
 </button>
 )}
 </div>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>

 <GlobalSearchScreen
 isOpen={showGlobalSearch}
 onClose={() => setShowGlobalSearch(false)}
 expenses={expenses}
 members={members}
 categories={categories}
 onExpenseClick={() => {}}
 />

 
 {modal.type === "group" && (
 <div
 key="group-backdrop"
 initial={{ opacity: 0 }}
 
 
 
 className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
 onClick={close}
 />
 )}
 {modal.type === "group" && (
 <div
 key="group-sheet"
 initial={{ y: "100%" }}
 
 
 
 className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[1.5rem] p-5 pb-8 max-h-[80vh] flex flex-col"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-bold">
 Demander à tous
 </h2>
 <button
 onClick={close}
 className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
 >
 <X size={16} />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto space-y-1 mb-4">
 {modal.participants.map((pid) => {
 const member = getMember(pid);
 const checked = modal.selectedIds.includes(
 pid
 );
 return (
 <button
 key={pid}
 onClick={() =>
 toggleGroupParticipant(pid)
 }
 className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
 checked
 ? "bg-primary/10 border border-primary/30"
 : "bg-background/50 border border-transparent"
 }`}
 >
 <div className="w-9 h-9 rounded-full overflow-hidden">
 <AvatarImg
 avatar={member?.avatar ?? ""}
 size="text-lg"
 />
 </div>
 <span className="flex-1 text-left text-sm font-medium">
 {member?.name}
 </span>
 <div
 className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
 checked
 ? "bg-primary border-primary"
 : "border-border"
 }`}
 >
 {checked && (
 <div
 
 
 className="w-2 h-2 rounded-full bg-primary-foreground"
 />
 )}
 </div>
 </button>
 );
 })}
 </div>

 <div className="mb-4">
 <textarea
 placeholder="Ajouter une note..."
 value={modal.note}
 onChange={(e) =>
 setModal({
 ...modal,
 note: e.target.value,
 })
 }
 className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
 />
 </div>

 <button
 onClick={handleGroupConfirm}
 disabled={modal.selectedIds.length === 0}
 className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
 >
 <Send size={16} />
 Envoyer la demande{" "}
 {modal.selectedIds.length > 0 &&
 `(${modal.selectedIds.length})`}
 </button>
 </div>
 )}
 

 
 {modal.type === "individual" && (
 <div
 key="indiv-backdrop"
 initial={{ opacity: 0 }}
 
 
 
 className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
 onClick={close}
 />
 )}
 {modal.type === "individual" && (
 <div
 key="indiv-sheet"
 initial={{ y: "100%" }}
 
 
 
 className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[1.5rem] p-5 pb-8 max-h-[70vh] flex flex-col"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-bold">
 Choisir un membre
 </h2>
 <button
 onClick={close}
 className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
 >
 <X size={16} />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto space-y-1 mb-4">
 {modal.participants.map((pid) => {
 const member = getMember(pid);
 const selected =
 modal.selectedId === pid;
 return (
 <button
 key={pid}
 onClick={() =>
 setModal({
 ...modal,
 selectedId: pid,
 })
 }
 className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
 selected
 ? "bg-primary/10 border border-primary/30"
 : "bg-background/50 border border-transparent"
 }`}
 >
 <div className="w-10 h-10 rounded-full overflow-hidden">
 <AvatarImg
 avatar={member?.avatar ?? ""}
 size="text-xl"
 />
 </div>
 <div className="flex-1 text-left">
 <p className="text-sm font-medium">
 {member?.name}
 </p>
 <p className="text-xs text-muted-foreground">
 {formatCurrency(modal.perPerson, currency)}
 </p>
 </div>
 {selected && (
 <div
 
 
 
 className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
 >
 <UserCheck
 size={14}
 className="text-primary-foreground"
 />
 </div>
 )}
 </button>
 );
 })}
 </div>

 <div className="mb-4">
 <textarea
 placeholder="Ajouter une note..."
 value={modal.note}
 onChange={(e) =>
 setModal({
 ...modal,
 note: e.target.value,
 })
 }
 className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
 />
 </div>

 <button
 onClick={handleIndividualConfirm}
 disabled={!modal.selectedId}
 className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
 >
 <Send size={16} />
 Envoyer la demande
 </button>
 </div>
 )}
 

 
 {modal.type === "reimbursement" && (
 <div
 key="reimb-backdrop"
 initial={{ opacity: 0 }}
 
 
 
 className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
 onClick={close}
 />
 )}
 {modal.type === "reimbursement" && (
 <div
 key="reimb-sheet"
 initial={{ y: "100%" }}
 
 
 
 className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[1.5rem] p-5 pb-8"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-bold">
 Demander remboursement
 </h2>
 <button
 onClick={close}
 className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
 >
 <X size={16} />
 </button>
 </div>

 <div className="bg-background/50 rounded-xl p-4 flex items-center gap-3 mb-4">
 <div className="w-10 h-10 rounded-full overflow-hidden">
 <AvatarImg
 avatar={
 getMember(modal.toId)?.avatar ?? ""
 }
 size="text-xl"
 />
 </div>
 <div className="flex-1">
 <p className="text-sm font-medium">
 {getMember(modal.toId)?.name}
 </p>
 <p className="text-xs text-muted-foreground">
 Montant à réclamer
 </p>
 </div>
 <p className="text-base font-bold text-primary">
 {formatCurrency(modal.perPerson, currency)}
 </p>
 </div>

 <div className="mb-4">
 <textarea
 placeholder="Ajouter une note..."
 value={modal.note}
 onChange={(e) =>
 setModal({
 ...modal,
 note: e.target.value,
 })
 }
 className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
 />
 </div>

 <button
 onClick={handleReimbursementConfirm}
 className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
 >
 <Send size={16} />
 Envoyer la demande
 </button>
 </div>
 )}
 
 </>
 );
});
ExpensesTab.displayName = "ExpensesTab";
