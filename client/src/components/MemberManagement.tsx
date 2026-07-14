import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, UserPlus, UserMinus, Shield, ShieldOff, ChevronRight, Check,
  X, Clock, Eye, History, Search, MoreVertical, Crown, Users, UserCheck,
  AlertTriangle, Copy, Share2, Link as LinkIcon, RefreshCw,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

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
  onChangeRole?: (id: string, role: string) => void;
  onApproveMember?: (id: string) => void;
  onRefuseMember?: (id: string) => void;
  pendingRequests?: PendingRequest[];
  onBack: () => void;
}

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

export function MemberManagement({
  members, currentMemberId, expenses, onRemoveMember, onAddMember,
  onChangeRole, onApproveMember, onRefuseMember, pendingRequests = [], onBack,
}: MemberManagementProps) {
  const [tab, setTab] = useState<"list" | "pending" | "memberDetail">("list");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showConfirmExpel, setShowConfirmExpel] = useState<string | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const generateInviteMutation = trpc.equilibra.generateInvite.useMutation();
  const [inviteTokenValue, setInviteTokenValue] = useState<string | null>(null);

  const handleGenerateInvite = async () => {
    try {
      const result = await generateInviteMutation.mutateAsync({});
      if (result?.token) {
        setInviteTokenValue(result.token);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (showInvite && !inviteTokenValue) {
      handleGenerateInvite();
    }
  }, [showInvite]);

  const inviteUrl = inviteTokenValue ? `${window.location.origin}?invite=${inviteTokenValue}` : `${window.location.origin}?invite=true`;
  const handleCopyInvite = async () => {
    try { await navigator.clipboard.writeText(inviteUrl); } catch {}
  };
  const handleShareInvite = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Équilibra Groupe", text: "Rejoins notre groupe !", url: inviteUrl }); } catch {}
    } else { handleCopyInvite(); }
  };

  const fmt = (amount: number) => new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", minimumFractionDigits: 2 }).format(amount);

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

  const fadeSlide = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

  const MemberDetail = () => {
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
        <div className="glass-card-enhanced rounded-[2rem] p-6 text-center relative overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          <motion.div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/30 mx-auto shadow-xl shadow-primary/10"
            whileHover={{ scale: 1.05, rotate: [0, -3, 3, 0] }}>
            <span className="text-4xl">{selectedMember.avatar}</span>
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
          <div className="glass-card-enhanced rounded-2xl p-4 text-center">
            <p className="text-xl font-bold">{memberStats?.expenseCount || 0}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Dépenses créées</p>
          </div>
          <div className="glass-card-enhanced rounded-2xl p-4 text-center">
            <p className="text-xl font-bold text-primary">{fmt(memberStats?.totalPaid || 0)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Total payé</p>
          </div>
          <div className="glass-card-enhanced rounded-2xl p-4 text-center">
            <p className="text-xl font-bold">{memberStats?.involvedCount || 0}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Participations</p>
          </div>
          <div className="glass-card-enhanced rounded-2xl p-4 text-center">
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
                  className="glass-card-enhanced rounded-2xl p-4 flex items-center gap-3">
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
          <h1 className="text-3xl font-bold tracking-tight">Membres</h1>
          <p className="text-sm text-muted-foreground">{members.length} membres</p>
        </div>
        {isAdmin(currentMemberId) && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowInvite(true)}
            className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
            <UserPlus size={20} />
          </motion.button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {tab === "memberDetail" ? (
          <MemberDetail key="detail" />
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
                      <div className="glass-card-enhanced rounded-2xl p-4 flex items-center gap-3 relative">
                        <motion.div whileHover={{ scale: 1.1 }}
                          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center border border-primary/20 shadow-md shadow-primary/5">
                          <span className="text-2xl">{member.avatar}</span>
                        </motion.div>
                        <div className="flex-1 min-w-0" onClick={() => { setSelectedMemberId(member.id); setTab("memberDetail"); }}>
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
                      className="glass-card-enhanced rounded-2xl p-4 flex items-center gap-3">
                      <span className="text-2xl">{req.memberAvatar}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{req.memberName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Demande {new Date(req.requestedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onApproveMember?.(req.memberId)}
                          className="w-9 h-9 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center border border-green-500/20">
                          <Check size={16} />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onRefuseMember?.(req.memberId)}
                          className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                          <X size={16} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Expel Modal */}
      <AnimatePresence>
        {showConfirmExpel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-6"
            onClick={() => setShowConfirmExpel(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-card-enhanced rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-center">Expulser ce membre ?</h3>
              <p className="text-sm text-muted-foreground text-center mt-2">
                {members.find(m => m.id === showConfirmExpel)?.name} sera retiré du groupe.
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
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-6"
            onClick={() => setShowInvite(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-card-enhanced rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <UserPlus size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-center">Inviter un membre</h3>
              <p className="text-sm text-muted-foreground text-center mt-2">Partagez ce lien pour rejoindre le groupe</p>
              <div className="mt-4 bg-background/50 rounded-xl p-3 flex items-center gap-2">
                <LinkIcon size={14} className="text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground truncate flex-1">{inviteUrl}</p>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setInviteTokenValue(null); handleGenerateInvite(); }}
                  className="w-7 h-7 rounded-lg bg-card/30 border border-border flex items-center justify-center shrink-0">
                  <RefreshCw size={12} className="text-muted-foreground" />
                </motion.button>
              </div>
              <div className="flex gap-2 mt-4">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleCopyInvite}
                  className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2">
                  <Copy size={16} /> Copier
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleShareInvite}
                  className="flex-1 py-3 rounded-2xl bg-card/30 border border-border text-sm font-semibold flex items-center justify-center gap-2">
                  <Share2 size={16} /> Partager
                </motion.button>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowInvite(false)}
                className="w-full py-3 rounded-2xl bg-card/30 border border-border text-sm font-semibold text-muted-foreground mt-2">
                Fermer
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-8" />
    </motion.div>
  );
}
