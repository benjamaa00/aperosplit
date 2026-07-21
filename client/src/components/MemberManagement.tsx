import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, UserPlus, UserMinus, Shield, ShieldOff, ChevronRight, Check,
  X, Clock, Search, Crown, Users, UserCheck,
  AlertTriangle, Copy, Share2, RefreshCw, Settings, Eye, EyeOff, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { AvatarImg } from "./AvatarImg";
import { Toggle } from "./Toggle";
import { formatCurrency } from "../utils/currency";

interface Member {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  status?: string;
  userId?: string;
}

interface PendingRequest {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  requestedAt: number;
}

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

interface MemberManagementProps {
  members: Member[];
  currentMemberId: string;
  expenses: Expense[];
  onRemoveMember: (id: string) => void;
  onAddMember?: () => void;
  onAddMemberDirect?: (name: string) => Promise<{ success: boolean; memberId?: string; accessPin?: string; error?: string }>;
  onChangeRole?: (id: string, role: string) => void;
  onApproveMember?: (id: string) => void;
  onRefuseMember?: (id: string) => void;
  pendingRequests?: PendingRequest[];
  onBack: () => void;
  onUpdateGroupSettings?: (settings: { name?: string; pinCode?: string | null; requireApproval?: boolean }) => void;
  onResetAllData?: () => void;
  groupName?: string;
  groupRequireApproval?: boolean;
}

function SettingsTab({ groupName, requireApproval, onUpdateSettings, onResetAllData }: {
  groupName: string;
  requireApproval: boolean;
  onUpdateSettings?: (settings: { name?: string; pinCode?: string | null; requireApproval?: boolean }) => void;
  onResetAllData?: () => void;
}) {
  const [name, setName] = useState(groupName);
  const [approval, setApproval] = useState(requireApproval);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground">Paramètres du groupe</h3>

      {/* Group Name */}
      <div className="glass-card-enhanced rounded-[1.25rem] p-4 space-y-3">
        <label className="text-xs font-semibold text-muted-foreground">Nom du groupe</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => onUpdateSettings?.({ name })}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">
          Sauvegarder
        </motion.button>
      </div>

      {/* Approval Toggle */}
      <div className="glass-card-enhanced rounded-[1.25rem] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Approbation requise</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Les nouveaux membres doivent être approuvés</p>
          </div>
          <Toggle enabled={approval} onToggle={() => { setApproval(!approval); onUpdateSettings?.({ requireApproval: !approval }); }} />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-500/20 overflow-hidden">
        <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/10">
          <p className="text-xs font-semibold text-red-400">Zone dangereuse</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-3">
            Réinitialiser toutes les données du groupe (dépenses, paiements, historique, membres invités). Seul le groupe sera conservé.
          </p>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-2">
            <AlertTriangle size={14} /> Réinitialiser toutes les données
          </motion.button>
        </div>
      </div>

      {/* Reset Confirm Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-6"
            onClick={() => setShowResetConfirm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-card-enhanced rounded-[1.25rem] p-6 w-full max-w-sm shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-center">Réinitialiser ?</h3>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Toutes les dépenses, paiements, historique et membres invités seront supprimés. Cette action est irréversible.
              </p>
              <div className="flex gap-2 mt-6">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 rounded-2xl bg-card/30 border border-border text-sm font-semibold">
                  Annuler
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowResetConfirm(false); onResetAllData?.(); }}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-semibold">
                  Réinitialiser
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface MemberDetailProps {
  selectedMember: Member | undefined;
  currentMemberId: string;
  memberStats: { totalPaid: number; totalOwed: number; expenseCount: number; involvedCount: number } | null;
  memberRecentExpenses: Expense[];
  isAdmin: (id: string) => boolean;
  onChangeRole?: (id: string, role: string) => void;
  setShowConfirmExpel: (id: string | null) => void;
  setTab: (tab: "list" | "pending" | "memberDetail" | "settings") => void;
}

function MemberDetail({ selectedMember, currentMemberId, memberStats, memberRecentExpenses, isAdmin, onChangeRole, setShowConfirmExpel, setTab }: MemberDetailProps) {
  const fmt = formatCurrency;
  const fadeSlide = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

  if (!selectedMember) return null;

  return (
    <motion.div {...fadeSlide} className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setTab("list")}
          className="w-10 h-10 rounded-2xl bg-card/30 border border-border flex items-center justify-center">
          <ArrowLeft size={20} />
        </motion.button>
        <h2 className="text-xl font-bold tracking-tight">Profil du membre</h2>
      </div>

      {/* Member Header */}
      <div className="glass-card-enhanced rounded-[1.25rem] p-6 text-center relative overflow-hidden">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        <motion.div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/30 mx-auto shadow-xl shadow-primary/10"
          whileHover={{ scale: 1.05, rotate: [0, -3, 3, 0] }}>
          <AvatarImg avatar={selectedMember.avatar} size="text-4xl" />
        </motion.div>
        <h3 className="text-xl font-bold mt-3">{selectedMember.name}</h3>
        <div className="flex items-center justify-center gap-2 mt-1">
          {isAdmin(selectedMember.id) && (
            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-semibold border border-amber-500/20 flex items-center gap-1">
              <Crown size={10} /> Admin
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">Membre depuis le début</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card-enhanced rounded-[1.25rem] p-4 text-center">
          <p className="text-xl font-bold">{memberStats?.expenseCount || 0}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Dépenses créées</p>
        </div>
        <div className="glass-card-enhanced rounded-[1.25rem] p-4 text-center">
          <p className="text-xl font-bold text-primary">{fmt(memberStats?.totalPaid || 0)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Total payé</p>
        </div>
        <div className="glass-card-enhanced rounded-[1.25rem] p-4 text-center">
          <p className="text-xl font-bold">{memberStats?.involvedCount || 0}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Participations</p>
        </div>
        <div className="glass-card-enhanced rounded-[1.25rem] p-4 text-center">
          <p className="text-xl font-bold text-orange-400">{fmt(memberStats?.totalOwed || 0)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Part à payer</p>
        </div>
      </div>

      {/* Recent Expenses */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Dépenses récentes</h4>
        {memberRecentExpenses.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Aucune dépense</p>
        ) : (
          <div className="space-y-2">
            {memberRecentExpenses.map((e, i) => (
              <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="glass-card-enhanced rounded-[1.25rem] p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center text-lg">{e.categoryEmoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{e.description}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(e.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                </div>
                <p className="text-sm font-bold">{fmt(e.amount)}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {isAdmin(currentMemberId) && selectedMember.id !== currentMemberId && (
        <div className="space-y-2">
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => onChangeRole?.(selectedMember.id, isAdmin(selectedMember.id) ? "member" : "admin")}
            className="w-full py-3.5 rounded-2xl bg-card/30 border border-border text-sm font-semibold flex items-center justify-center gap-2">
            {isAdmin(selectedMember.id) ? <ShieldOff size={16} /> : <Shield size={16} />}
            {isAdmin(selectedMember.id) ? "Retirer admin" : "Promouvoir admin"}
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => setShowConfirmExpel(selectedMember.id)}
            className="w-full py-3.5 rounded-2xl bg-red-500/10 border border-red-500/10 text-red-400 text-sm font-semibold flex items-center justify-center gap-2">
            <UserMinus size={16} />
            Expulser du groupe
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

export function MemberManagement({
  members, currentMemberId, expenses, onRemoveMember, onAddMember, onAddMemberDirect,
  onChangeRole, onApproveMember, onRefuseMember, pendingRequests = [], onBack,
  onUpdateGroupSettings, onResetAllData, groupName = "Équilibra Groupe", groupRequireApproval = false,
}: MemberManagementProps) {
  const [tab, setTab] = useState<"list" | "pending" | "memberDetail" | "settings">("list");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showConfirmExpel, setShowConfirmExpel] = useState<string | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberName, setAddMemberName] = useState("");
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberResult, setAddMemberResult] = useState<{ name: string; accessPin: string } | null>(null);
  const [showPin, setShowPin] = useState(false);

  const fmt = formatCurrency;

  const selectedMember = useMemo(() => members.find(m => m.id === selectedMemberId), [members, selectedMemberId]);

  const memberStats = useMemo(() => {
    if (!selectedMemberId) return null;
    const memberExpenses = expenses.filter(e => e.payerId === selectedMemberId);
    const totalPaid = memberExpenses.reduce((s, e) => s + e.amount, 0);
    const involvedIn = expenses.filter(e => e.participants.includes(selectedMemberId));
    const totalOwed = involvedIn.reduce((s, e) => s + e.amount / e.participants.length, 0);
    return { totalPaid, totalOwed, expenseCount: memberExpenses.length, involvedCount: involvedIn.length };
  }, [selectedMemberId, expenses]);

  const memberRecentExpenses = useMemo(() => {
    if (!selectedMemberId) return [];
    return expenses.filter(e => e.payerId === selectedMemberId).slice(-10).reverse();
  }, [selectedMemberId, expenses]);

  const filtered = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter(m => m.name.toLowerCase().includes(q));
  }, [members, search]);

  const isAdmin = (id: string) => members.find(m => m.id === id)?.role === "admin";

  const handleAddMember = async () => {
    if (!addMemberName.trim() || !onAddMemberDirect) return;
    setAddMemberLoading(true);
    try {
      const result = await onAddMemberDirect(addMemberName.trim());
      if (result?.success && result.accessPin) {
        setAddMemberResult({ name: addMemberName.trim(), accessPin: result.accessPin });
      } else if (result?.success) {
        toast.success(`${addMemberName.trim()} a été ajouté au groupe`);
        setAddMemberName("");
        setShowAddMember(false);
      } else {
        toast.error(result?.error || "Erreur lors de l'ajout");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleCopyPin = async (pin: string) => {
    try { await navigator.clipboard.writeText(pin); toast.success("Code copié !"); } catch {}
  };

  const handleSharePin = async (name: string, pin: string) => {
    const text = `Rejoins le groupe Équilibra !\nCode d'accès : ${pin}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Équilibra", text }); } catch {}
    } else {
      handleCopyPin(pin);
    }
  };

  const fadeSlide = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto px-5 pt-12 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}
          className="w-10 h-10 rounded-2xl bg-card/30 border border-border flex items-center justify-center">
          <ArrowLeft size={20} />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Membres</h1>
          <p className="text-sm text-muted-foreground">{members.length} membres</p>
        </div>
        {isAdmin(currentMemberId) && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setShowAddMember(true); setAddMemberName(""); setAddMemberResult(null); setShowPin(false); }}
            className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
            <UserPlus size={20} />
          </motion.button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {tab === "memberDetail" ? (
          <MemberDetail key="detail"
            selectedMember={selectedMember}
            currentMemberId={currentMemberId}
            memberStats={memberStats}
            memberRecentExpenses={memberRecentExpenses}
            isAdmin={isAdmin}
            onChangeRole={onChangeRole}
            setShowConfirmExpel={setShowConfirmExpel}
            setTab={setTab}
          />
        ) : (
          <motion.div {...fadeSlide} className="space-y-5">
            {/* Tabs */}
            <div className="flex gap-2 bg-card/30 border border-border rounded-2xl p-1">
              <button onClick={() => setTab("list")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${tab === "list" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground"}`}>
                <Users size={14} /> Tous
              </button>
              <button onClick={() => setTab("pending")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${tab === "pending" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground"}`}>
                <Clock size={14} /> En attente
                {pendingRequests.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{pendingRequests.length}</span>
                )}
              </button>
              {isAdmin(currentMemberId) && (
                <button onClick={() => setTab("settings")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${tab === "settings" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground"}`}>
                  <Settings size={14} /> Paramètres
                </button>
              )}
            </div>

            {tab === "list" && (
              <>
                {/* Search */}
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="Rechercher un membre..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>

                {/* Members List */}
                <div className="space-y-2">
                  {filtered.map((member, i) => (
                    <motion.div key={member.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <div className="glass-card-enhanced rounded-[1.25rem] p-4 flex items-center gap-3 relative hover:bg-card/60 transition-colors duration-200">
                        <motion.div whileHover={{ scale: 1.1 }}
                          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center border border-primary/20 shadow-md shadow-primary/5">
                          <AvatarImg avatar={member.avatar} size="text-2xl" />
                        </motion.div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setSelectedMemberId(member.id); setTab("memberDetail"); }}>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold truncate">{member.name}</p>
                            {isAdmin(member.id) && <Crown size={12} className="text-amber-400 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {member.id === currentMemberId ? "Vous" : member.role === "admin" ? "Administrateur" : "Membre"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isAdmin(currentMemberId) && member.id !== currentMemberId && (
                            <>
                              <motion.button whileTap={{ scale: 0.9 }}
                                onClick={() => setShowRoleMenu(showRoleMenu === member.id ? null : member.id)}
                                className="w-8 h-8 rounded-xl bg-muted/30 flex items-center justify-center">
                                <Shield size={14} className="text-muted-foreground" />
                              </motion.button>
                              <motion.button whileTap={{ scale: 0.8 }}
                                onClick={() => setShowConfirmExpel(member.id)}
                                className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                                <X size={14} />
                              </motion.button>
                            </>
                          )}
                          <ChevronRight size={14} className="text-muted-foreground/40" />
                        </div>

                        {/* Role Menu Dropdown */}
                        <AnimatePresence>
                          {showRoleMenu === member.id && (
                            <motion.div initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -10 }}
                              className="absolute right-4 top-full mt-1 bg-card border border-white/10 rounded-2xl shadow-2xl shadow-black/20 z-50 overflow-hidden min-w-[160px]">
                              <button onClick={() => { onChangeRole?.(member.id, "admin"); setShowRoleMenu(null); }}
                                className="w-full px-4 py-3 text-sm font-medium text-left flex items-center gap-2 hover:bg-muted/50">
                                <Crown size={14} className="text-amber-400" /> Admin
                              </button>
                              <button onClick={() => { onChangeRole?.(member.id, "member"); setShowRoleMenu(null); }}
                                className="w-full px-4 py-3 text-sm font-medium text-left flex items-center gap-2 hover:bg-muted/50 border-t border-border">
                                <Users size={14} className="text-muted-foreground" /> Membre
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {tab === "pending" && (
              <div className="space-y-2">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
                      <UserCheck size={36} className="text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">Aucune demande en attente</p>
                  </div>
                ) : (
                  pendingRequests.map((req, i) => (
                    <motion.div key={req.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="glass-card-enhanced rounded-[1.25rem] p-4 flex items-center gap-3">
                      <AvatarImg avatar={req.memberAvatar} size="text-2xl" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{req.memberName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Demande {new Date(req.requestedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => onApproveMember?.(req.memberId)}
                          className="w-9 h-9 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center border border-green-500/20">
                          <Check size={16} />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => onRefuseMember?.(req.memberId)}
                          className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                          <X size={16} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {tab === "settings" && (
              <SettingsTab
                groupName={groupName}
                requireApproval={groupRequireApproval}
                onUpdateSettings={onUpdateGroupSettings}
                onResetAllData={onResetAllData}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Expel Modal */}
      <AnimatePresence>
        {showConfirmExpel && (() => {
          const expelMember = members.find(m => m.id === showConfirmExpel);
          if (!expelMember) { setShowConfirmExpel(null); return null; }
          return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-6"
            onClick={() => setShowConfirmExpel(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-card-enhanced rounded-[1.25rem] p-6 w-full max-w-sm shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-center">Expulser ce membre ?</h3>
              <p className="text-sm text-muted-foreground text-center mt-2">
                {expelMember.name} sera retiré du groupe.
              </p>
              <div className="flex gap-2 mt-6">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowConfirmExpel(null)}
                  className="flex-1 py-3 rounded-2xl bg-card/30 border border-border text-sm font-semibold">
                  Annuler
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { onRemoveMember(showConfirmExpel); setShowConfirmExpel(null); setTab("list"); }}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-semibold">
                  Expulser
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMember && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-6"
            onClick={() => { if (!addMemberLoading) { setShowAddMember(false); setAddMemberResult(null); } }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-card-enhanced rounded-[1.25rem] p-6 w-full max-w-sm shadow-2xl">

              {!addMemberResult ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                    <UserPlus size={24} className="text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-center">Ajouter un membre</h3>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Ajoutez directement un nouveau membre au groupe
                  </p>
                  <input
                    type="text"
                    placeholder="Nom du nouveau membre"
                    value={addMemberName}
                    onChange={e => setAddMemberName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddMember()}
                    disabled={addMemberLoading}
                    className="w-full px-4 py-3.5 rounded-2xl bg-background/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mt-5 disabled:opacity-50"
                    maxLength={80}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-4">
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setShowAddMember(false); setAddMemberResult(null); }}
                      className="flex-1 py-3 rounded-2xl bg-card/30 border border-border text-sm font-semibold" disabled={addMemberLoading}>
                      Annuler
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddMember}
                      disabled={!addMemberName.trim() || addMemberLoading}
                      className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                      {addMemberLoading ? <><Loader2 size={16} className="animate-spin" /> Ajout...</> : <><Check size={16} /> Ajouter</>}
                    </motion.button>
                  </div>
                </>
              ) : (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <Check size={24} className="text-green-500" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-center">{addMemberResult.name} ajouté !</h3>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Partagez le code d'accès avec {addMemberResult.name} pour qu'il puisse rejoindre le groupe
                  </p>
                  <div className="mt-5 bg-background/50 rounded-2xl p-4 border border-border">
                    <p className="text-[11px] text-muted-foreground font-semibold mb-2">Code d'accès du groupe</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold tracking-widest flex-1 text-center">
                        {showPin ? addMemberResult.accessPin : "••••••"}
                      </p>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowPin(!showPin)}
                        className="w-9 h-9 rounded-xl bg-card/30 border border-border flex items-center justify-center">
                        {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                      </motion.button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center mt-3">
                    Le membre ouvre l'app → entre ce code → sélectionne son nom
                  </p>
                  <div className="flex gap-2 mt-4">
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => handleSharePin(addMemberResult.name, addMemberResult.accessPin)}
                      className="flex-1 py-3 rounded-2xl bg-card/30 border border-border text-sm font-semibold flex items-center justify-center gap-2">
                      <Share2 size={16} /> Partager
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => { handleCopyPin(addMemberResult.accessPin); }}
                      className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2">
                      <Copy size={16} /> Copier le code
                    </motion.button>
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => { setShowAddMember(false); setAddMemberResult(null); setShowPin(false); }}
                    className="w-full py-3 rounded-2xl bg-card/30 border border-border text-sm font-semibold text-muted-foreground mt-2">
                    Fermer
                  </motion.button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-8" />
    </motion.div>
  );
}
