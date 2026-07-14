import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Receipt, Scale, History, BarChart3, User, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

import type { Member, Expense, PendingPayment, Notification, GroupCategory, Screen, Tab } from "./types";
import { CATEGORIES, GROUP_ID, spring, fadeUp } from "./constants";
import { formatCurrency, formatDate } from "./utils/currency";
import { simplifyDebts } from "./utils/debts";
import { checkBiometricAvailable, registerBiometric, authenticateBiometric } from "./utils/biometric";
import { storePhotoAvatar, resolveAvatar } from "./utils/avatarStorage";
import { useNotifications } from "./hooks/useNotifications";
import { useHaptic } from "./hooks/useHaptic";

import { AccessScreen } from "./screens/AccessScreen";
import { IdentityScreen } from "./screens/IdentityScreen";
import { LockScreen } from "./screens/LockScreen";
import { NotificationsScreen } from "./screens/NotificationsScreen";
import { NotificationSettingsScreen } from "./screens/NotificationSettingsScreen";

import { HomeTab } from "./tabs/HomeTab";
import { ExpensesTab } from "./tabs/ExpensesTab";
import { BalancesTab } from "./tabs/BalancesTab";
import { StatsTab } from "./tabs/StatsTab";
import { ProfileTab } from "./tabs/ProfileTab";

import { AppShell } from "./components/AppShell";
import { AddExpenseSheet } from "./components/AddExpenseSheet";
import { PaymentHistory } from "./components/PaymentHistory";
import { SettingsScreen } from "./components/SettingsScreen";
import { MemberManagement } from "./components/MemberManagement";
import { ReportsScreen } from "./components/ReportsScreen";
import { RegisterScreen } from "./components/RegisterScreen";
import { InviteScreen } from "./components/InviteScreen";

const isNetlify = import.meta.env.VITE_NETLIFY === "true";

function prepareAvatar(memberId: string, avatar: string): string {
  if (avatar.startsWith("data:")) return storePhotoAvatar(memberId, avatar);
  return avatar;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("identity");
  const [accessCode, setAccessCode] = useState<string>(() => localStorage.getItem("equilibra_access") || localStorage.getItem("aperosplit_access") || "");
  const [members, setMembers] = useState<Member[]>([]);
  const [currentMemberId, setCurrentMemberId] = useState<string>("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [completedPayments, setCompletedPayments] = useState<PendingPayment[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState<Record<string, boolean>>({});
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    const v = localStorage.getItem("equilibra_monthly_budget");
    return v ? parseFloat(v) : 1000;
  });
  const [currency, setCurrency] = useState<string>(() => localStorage.getItem("equilibra_currency") || "MAD");
  const [autoReminders, setAutoReminders] = useState(() => localStorage.getItem("equilibra_auto_reminders") !== "false");
  const [privacyMode, setPrivacyMode] = useState(() => localStorage.getItem("equilibra_privacy_mode") === "true");
  const [offlineMode, setOfflineMode] = useState(() => localStorage.getItem("equilibra_offline_mode") === "true");
  const [pushNotifications, setPushNotifications] = useState(() => localStorage.getItem("equilibra_push_notifications") !== "false");
  const [reminderDelay, setReminderDelay] = useState(() => parseInt(localStorage.getItem("equilibra_reminder_delay") || "3"));
  const [categories, setCategories] = useState<GroupCategory[]>([]);
  const [selectedGroupId] = useState<string>(GROUP_ID);
  const [groupPin, setGroupPin] = useState<string | null>(null);
  const [requireApproval, setRequireApproval] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { permission: notificationPermission, requestPermission, showNotification } = useNotifications();
  const haptic = useHaptic();

  const currentMember = useMemo(() => members.find((m) => m.id === currentMemberId), [members, currentMemberId]);
  const pendingMembers = useMemo(() => members.filter(m => m.status === "pending"), [members]);

  // tRPC
  const initGroup = trpc.equilibra.initGroup.useMutation();
  const addExpenseMutation = trpc.equilibra.addExpense.useMutation();
  const deleteExpenseMutation = trpc.equilibra.deleteExpense.useMutation();
  const requestPaymentMutation = trpc.equilibra.requestPayment.useMutation();
  const confirmPaymentMutation = trpc.equilibra.confirmPayment.useMutation();
  const refusePaymentMutation = trpc.equilibra.refusePayment.useMutation();
  const joinGroupByPinMutation = trpc.equilibra.joinGroupByPin.useMutation();
  const joinGroupByInviteMutation = trpc.equilibra.joinGroupByInvite.useMutation();
  const expelMemberMutation = trpc.equilibra.expelMember.useMutation();
  const changeMemberRoleMutation = trpc.equilibra.changeMemberRole.useMutation();
  const markNotificationReadMutation = trpc.equilibra.markNotificationRead.useMutation();
  const markAllNotificationsReadMutation = trpc.equilibra.markAllNotificationsRead.useMutation();
  const exportCSVMutation = trpc.equilibra.exportCSV.useMutation();
  const confirmReceiptMutation = trpc.equilibra.confirmReceipt.useMutation();
  const resetAllDataMutation = trpc.equilibra.resetAllData.useMutation();
  const updateGroupSettingsMutation = trpc.equilibra.updateGroupSettings.useMutation();
  const approveMemberMutation = trpc.equilibra.approveMember.useMutation();
  const refuseMemberMutation = trpc.equilibra.refuseMember.useMutation();
  const leaveMemberMutation = trpc.equilibra.leaveMember.useMutation();

  const { data: groupData, refetch } = trpc.equilibra.getGroupData.useQuery(undefined, { enabled: !isNetlify, refetchInterval: 10000, retry: 2, refetchOnWindowFocus: true });
  const getNotificationsQuery = trpc.equilibra.getNotifications.useQuery({ memberId: currentMemberId }, { enabled: !!currentMemberId && !isNetlify, refetchInterval: 5000 });

  // ─── Effects ───────────────────────────────────────────────
  useEffect(() => {
    if (notificationPermission === "default") {
      const handler = () => { requestPermission(); };
      document.addEventListener("click", handler, { once: true });
      document.addEventListener("touchstart", handler, { once: true });
      return () => { document.removeEventListener("click", handler); document.removeEventListener("touchstart", handler); };
    }
  }, [notificationPermission, requestPermission]);

  useEffect(() => { checkBiometricAvailable().then(setBiometricAvailable); }, []);

  useEffect(() => {
    const v = localStorage.getItem("equilibra_monthly_budget");
    if (v) setMonthlyBudget(parseFloat(v));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");
    if (invite) { setInviteToken(invite); setScreen("invite"); return; }
    if (!accessCode) setScreen("access");
  }, [accessCode]);

  useEffect(() => {
    if (syncingFromServer.current) { syncingFromServer.current = false; return; }
    if (!isNetlify && members.length > 0) {
      initGroup.mutateAsync({ members: members.map(m => ({ id: m.id, name: m.name, avatar: m.avatar, role: m.role as "admin" | "member" | undefined, status: m.status as "active" | "pending" | undefined })) }).catch(() => {});
    }
  }, [isNetlify, members.length]);

  useEffect(() => {
    if (getNotificationsQuery.data) {
      setNotifications(getNotificationsQuery.data);
      setUnreadCount(getNotificationsQuery.data.filter((n) => !n.read).length);
    }
  }, [getNotificationsQuery.data]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("equilibra_data");
      if (stored) {
        const data = JSON.parse(stored);
        if (data.members) setMembers(data.members);
        if (data.expenses) setExpenses(data.expenses);
        if (data.pendingPayments) setPendingPayments(data.pendingPayments);
        if (data.currentMemberId) setCurrentMemberId(data.currentMemberId);
        if (data.completedPayments) setCompletedPayments(data.completedPayments);
        if (data.biometricEnabled) setBiometricEnabled(data.biometricEnabled);
      }
    } catch {}
  }, []);

  // Prevent sending server-synced data back to server (infinite loop guard)
  const syncingFromServer = useRef(false);

  // Sync server data to client state (server is source of truth)
  useEffect(() => {
    if (!groupData) return;
    syncingFromServer.current = true;
    if (groupData.members && groupData.members.length > 0) {
      setMembers(groupData.members.map((m: any) => ({ id: m.id, name: m.name, avatar: m.avatar, role: m.role, status: m.status })));
    }
    if (groupData.expenses) setExpenses(groupData.expenses);
    if (groupData.pending) setPendingPayments(groupData.pending);
    if (groupData.history) setCompletedPayments(groupData.history);
    if (groupData.requireApproval !== undefined) setRequireApproval(groupData.requireApproval);
    if (groupData.pinCode) setGroupPin(groupData.pinCode);
  }, [groupData]);

  useEffect(() => {
    try {
      localStorage.setItem("equilibra_data", JSON.stringify({ members, expenses, pendingPayments, currentMemberId, biometricEnabled }));
    } catch {}
  }, [members, expenses, pendingPayments, currentMemberId, biometricEnabled]);

  useEffect(() => {
    try { localStorage.setItem("equilibra_completed_payments", JSON.stringify(completedPayments)); } catch {}
  }, [completedPayments]);

  useEffect(() => {
    if (isNetlify || groupData) return;
    const interval = setInterval(() => {
      try {
        const stored = localStorage.getItem("equilibra_data");
        if (stored) {
          const data = JSON.parse(stored);
          if (data.expenses) setExpenses(data.expenses);
          if (data.pendingPayments) setPendingPayments(data.pendingPayments);
          if (data.members) setMembers(data.members);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [isNetlify, groupData]);

  // ─── Computed ──────────────────────────────────────────────
  const balances = useMemo(() => {
    const b: Record<string, number> = {};
    members.forEach((m) => { b[m.id] = 0; });
    expenses.forEach((e) => {
      const share = e.amount / e.participants.length;
      e.participants.forEach((pid) => { if (b[pid] !== undefined) b[pid] -= share; });
      if (b[e.payerId] !== undefined) b[e.payerId] += e.amount;
    });
    completedPayments.forEach((p) => {
      if (p.status === "completed" || p.status === "paid") {
        if (b[p.fromId] !== undefined) b[p.fromId] += p.amount;
        if (b[p.toId] !== undefined) b[p.toId] -= p.amount;
      }
    });
    pendingPayments.forEach((p) => {
      if (p.status === "accepted" || p.status === "in_progress" || p.status === "paid") {
        if (b[p.fromId] !== undefined) b[p.fromId] += p.amount;
        if (b[p.toId] !== undefined) b[p.toId] -= p.amount;
      }
    });
    return b;
  }, [members, expenses, completedPayments, pendingPayments]);

  const suggestedTransactions = useMemo(() => simplifyDebts(balances), [balances]);

  // ─── Handlers ──────────────────────────────────────────────
  const updateBudget = useCallback((b: number) => { setMonthlyBudget(b); localStorage.setItem("equilibra_monthly_budget", b.toString()); }, []);
  const updateCurrency = useCallback((c: string) => { setCurrency(c); localStorage.setItem("equilibra_currency", c); }, []);

  const handleAccessCode = useCallback((code: string) => {
    setAccessCode(code);
    localStorage.setItem("equilibra_access", code);
    setScreen("identity");
  }, []);

  const handleSwitchAccount = useCallback((id: string) => {
    setCurrentMemberId(id);
    setScreen("main");
  }, []);

  const selectIdentity = useCallback((id: string) => {
    const stored = localStorage.getItem("equilibra_locked_member");
    if (stored && stored !== id) { showNotification("Accès verrouillé", `Compte verrouillé sur ${members.find((m) => m.id === stored)?.name}`); return; }
    handleSwitchAccount(id);
  }, [handleSwitchAccount, members, showNotification]);

  const handleBiometricUnlock = useCallback(async () => {
    try {
      const ok = await authenticateBiometric(currentMemberId);
      if (ok) { haptic("success"); setScreen("main"); }
    } catch { setScreen("main"); }
  }, [haptic, currentMemberId]);

  const toggleBiometric = useCallback(async () => {
    if (!currentMemberId) return;
    if (biometricEnabled[currentMemberId]) {
      setBiometricEnabled((prev) => ({ ...prev, [currentMemberId]: false }));
    } else {
      try {
        const ok = await registerBiometric(currentMemberId);
        if (ok) { setBiometricEnabled((prev) => ({ ...prev, [currentMemberId]: true })); haptic("success"); }
      } catch {}
    }
  }, [currentMemberId, biometricEnabled, haptic]);

  const addExpense = useCallback(async (expense: Omit<Expense, "id" | "date">) => {
    haptic("light");
    const newExpense = { ...expense, id: Date.now().toString(), date: Date.now() } as Expense;
    setExpenses((prev) => [newExpense, ...prev]);
    if (!isNetlify) { try { await addExpenseMutation.mutateAsync({ description: expense.description, amount: expense.amount, category: expense.category, payerId: expense.payerId, participants: expense.participants, photoUrl: expense.photoUrl, status: expense.status as "pending" | "validated" | "refused" | undefined }); await refetch(); } catch {} }
  }, [haptic, addExpenseMutation, refetch, isNetlify]);

  const deleteExpense = useCallback((id: string) => {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) return;
    const currentMember = members.find((m) => m.id === currentMemberId);
    if (expense.payerId !== currentMemberId && currentMember?.role !== "admin") return;
    haptic("medium");
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (!isNetlify) { deleteExpenseMutation.mutateAsync({ expenseId: id, description: expense.description, amount: expense.amount, authorId: currentMemberId }).then(() => refetch()).catch(() => {}); }
  }, [expenses, currentMemberId, members, haptic, deleteExpenseMutation, refetch, isNetlify]);

  const requestPayment = useCallback(async (toId: string, amount: number, expenseId?: string) => {
    if (!currentMemberId) return;
    haptic("light");
    const payment: PendingPayment = {
      id: Date.now().toString(), fromId: currentMemberId, fromName: members.find((m) => m.id === currentMemberId)?.name || "",
      toId, toName: members.find((m) => m.id === toId)?.name || "", amount, status: "pending",
      createdAt: Date.now(), notificationSent: false, notificationCount: 0, expenseId,
    };
    setPendingPayments((prev) => [...prev, payment]);
    showNotification("Demande envoyée", `Demande de ${formatCurrency(amount)} envoyée`);
    if (!isNetlify) { try { await requestPaymentMutation.mutateAsync({ ...payment, groupId: GROUP_ID }); await refetch(); } catch {} }
  }, [currentMemberId, members, haptic, pendingPayments, requestPaymentMutation, refetch, showNotification, isNetlify]);

  const requestGroupPayment = useCallback((expenseId: string, participantIds?: string[]) => {
    const expense = expenses.find((e) => e.id === expenseId);
    if (!expense) return;
    const ids = participantIds || expense.participants.filter((p) => p !== currentMemberId);
    const perPerson = expense.amount / expense.participants.length;
    ids.forEach((pid) => requestPayment(pid, perPerson, expenseId));
  }, [expenses, currentMemberId, requestPayment]);

  const confirmPayment = useCallback((id: string) => {
    haptic("success");
    setPendingPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: "accepted" as const, respondedAt: Date.now() } : p));
  }, [haptic]);

  const refusePayment = useCallback((id: string, comment?: string) => {
    haptic("medium");
    setPendingPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: "refused" as const, respondedAt: Date.now(), comment } : p));
    showNotification("Paiement refusé", "La demande a été refusée");
  }, [haptic, showNotification]);

  const resentPayment = useCallback((id: string) => {
    haptic("light");
    setPendingPayments((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const attempts = (p.attemptCount || 0) + 1;
      if (attempts >= 3) return { ...p, status: "late" as const, attemptCount: attempts, notificationCount: p.notificationCount + 1 };
      return { ...p, notificationCount: p.notificationCount + 1, attemptCount: attempts, status: p.status === "pending" ? "late" as const : p.status };
    }));
  }, [haptic]);

  const confirmReceipt = useCallback((id: string) => {
    haptic("success");
    const payment = pendingPayments.find((p) => p.id === id);
    if (payment) {
      setCompletedPayments((prev) => [...prev, { ...payment, status: "completed" as const, completedAt: Date.now() }]);
      setPendingPayments((prev) => prev.filter((p) => p.id !== id));
    }
    if (!isNetlify) { confirmReceiptMutation.mutateAsync({ paymentId: id }).then(() => refetch()).catch(() => {}); }
  }, [haptic, pendingPayments, confirmReceiptMutation, refetch, isNetlify]);

  const reportNotReceived = useCallback((id: string, comment?: string) => {
    haptic("medium");
    setPendingPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: "disputed" as const, disputeNote: comment } : p));
    showNotification("Litige ouvert", "Le paiement est en litige");
  }, [haptic, showNotification]);

  const handleRegister = useCallback(async (name: string, rawAvatar: string) => {
    const memberId = Date.now().toString();
    const avatar = prepareAvatar(memberId, rawAvatar);
    const newMember: Member = { id: memberId, name, avatar, role: "member", status: "pending" };
    setMembers((prev) => [...prev, newMember]);
    setCurrentMemberId(newMember.id);
    if (!isNetlify && inviteToken) {
      try {
        const r = await joinGroupByInviteMutation.mutateAsync({ token: inviteToken, memberId: newMember.id, memberName: name, memberAvatar: avatar });
        if (r?.requiresApproval) { setScreen("identity"); toast.info("Votre demande est en attente d'approbation par l'admin."); return; }
      } catch {}
    }
    setScreen("main");
  }, [inviteToken, joinGroupByInviteMutation, isNetlify]);

  const addMember = useCallback(async (name: string, rawAvatar: string) => {
    const memberId = Date.now().toString();
    const avatar = prepareAvatar(memberId, rawAvatar);
    const newMember: Member = { id: memberId, name, avatar };
    setMembers((prev) => [...prev, newMember]);
    if (!isNetlify) { try { await initGroup.mutateAsync({ members: [...members, newMember].map(m => ({ id: m.id, name: m.name, avatar: m.avatar, role: m.role as "admin" | "member" | undefined })) }); await refetch(); } catch {} }
  }, [members, initGroup, refetch, isNetlify]);

  const removeMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (!isNetlify) { expelMemberMutation.mutateAsync({ memberId: id, expelledBy: currentMemberId }).then(() => refetch()).catch(() => {}); }
  }, [currentMemberId, expelMemberMutation, refetch, isNetlify]);

  const approveMember = useCallback((id: string) => {
    setMembers((prev) => prev.map(m => m.id === id ? { ...m, status: "active" } : m));
    if (!isNetlify) { approveMemberMutation.mutateAsync({ memberId: id, approvedBy: currentMemberId }).then(() => refetch()).catch(() => {}); }
  }, [currentMemberId, approveMemberMutation, refetch, isNetlify]);

  const refuseMemberCb = useCallback((id: string) => {
    setMembers((prev) => prev.filter(m => m.id !== id));
    if (!isNetlify) { refuseMemberMutation.mutateAsync({ memberId: id, refusedBy: currentMemberId }).then(() => refetch()).catch(() => {}); }
  }, [currentMemberId, refuseMemberMutation, refetch, isNetlify]);

  const leaveGroup = useCallback(async () => {
    if (currentMember?.role === "admin") { toast.error("L'admin ne peut pas quitter. Transférez d'abord le rôle admin."); return; }
    setMembers(prev => prev.filter(m => m.id !== currentMemberId));
    setExpenses(prev => prev.filter(e => e.payerId !== currentMemberId));
    setCurrentMemberId("");
    setScreen("identity");
    if (!isNetlify) { await leaveMemberMutation.mutateAsync({ memberId: currentMemberId }); await refetch(); }
  }, [currentMember, currentMemberId, leaveMemberMutation, refetch, isNetlify]);

  // ─── Screen Routing ────────────────────────────────────────
  if (screen === "access") return <AppShell><AccessScreen onSubmit={handleAccessCode} /></AppShell>;
  if (screen === "identity") {
    if (members.length === 0) return <AppShell><RegisterScreen onRegister={(name, rawAvatar) => {
      const memberId = Date.now().toString();
      const avatar = prepareAvatar(memberId, rawAvatar);
      const newMember: Member = { id: memberId, name, avatar, role: "admin", status: "active" };
      setMembers([newMember]);
      setCurrentMemberId(newMember.id);
      setScreen("main");
      if (!isNetlify) {
        syncingFromServer.current = true;
        initGroup.mutateAsync({ members: [{ id: memberId, name, avatar, role: "admin", status: "active" }] }).catch(() => {});
      }
    }} onBack={() => setScreen("access")} groupName="Équilibra" /></AppShell>;
    return <AppShell><IdentityScreen members={members} onSelect={selectIdentity} onReset={async () => { try { await resetAllDataMutation.mutateAsync(); setMembers([]); setExpenses([]); setPendingPayments([]); setCompletedPayments([]); toast.success("Groupe réinitialisé"); } catch { toast.error("Erreur lors de la réinitialisation"); } }} /></AppShell>;
  }
  if (screen === "register") return <AppShell><RegisterScreen onRegister={handleRegister} onBack={() => setScreen("access")} /></AppShell>;
  if (screen === "invite") return <AppShell><InviteScreen inviteToken={inviteToken!} onJoinByPin={async (pin, name, rawAvatar) => {
    const memberId = Date.now().toString();
    const avatar = prepareAvatar(memberId, rawAvatar);
    try {
      const r = await joinGroupByPinMutation.mutateAsync({ pinCode: pin, groupId: selectedGroupId, memberId, memberName: name, memberAvatar: avatar });
      if (r?.success) {
        const status = r.requiresApproval ? "pending" : "active";
        const newMember: Member = { id: memberId, name, avatar, role: "member", status };
        setMembers((prev) => [...prev, newMember]);
        setCurrentMemberId(memberId);
        if (r.requiresApproval) { setScreen("identity"); toast.info("Votre demande est en attente d'approbation par l'admin."); }
        else { setScreen("main"); }
      }
      return r ?? { success: false };
    } catch { return { success: false, error: "Erreur de connexion" }; }
  }} onJoinByInvite={async (name, rawAvatar) => {
    const memberId = Date.now().toString();
    const avatar = prepareAvatar(memberId, rawAvatar);
    try {
      const r = await joinGroupByInviteMutation.mutateAsync({ token: inviteToken!, memberId, memberName: name, memberAvatar: avatar });
      if (r?.success) {
        const status = r.requiresApproval ? "pending" : "active";
        const newMember: Member = { id: memberId, name, avatar, role: "member", status };
        setMembers((prev) => [...prev, newMember]);
        setCurrentMemberId(memberId);
        if (r.requiresApproval) { setScreen("identity"); toast.info("Votre demande est en attente d'approbation par l'admin."); }
        else { setScreen("main"); }
      }
      return r ?? { success: false };
    } catch { return { success: false, error: "Erreur de connexion" }; }
  }} onBack={() => setScreen("access")} /></AppShell>;
  if (screen === "lock" && currentMember) return <AppShell><LockScreen member={currentMember} onUnlock={handleBiometricUnlock} onSkip={() => setScreen("main")} onSwitchIdentity={() => setScreen("identity")} /></AppShell>;
  if (screen === "notifications") return <AppShell><NotificationsScreen notifications={notifications} currentMemberId={currentMemberId} onBack={() => setScreen("main")} onMarkRead={(id) => markNotificationReadMutation.mutate({ notificationId: id })} onMarkAllRead={() => markAllNotificationsReadMutation.mutate({ memberId: currentMemberId })} /></AppShell>;
  if (screen === "notificationSettings") return <AppShell><NotificationSettingsScreen settings={{ pushEnabled: pushNotifications, emailEnabled: false, reminderFrequency: reminderDelay.toString() + "h" }} onBack={() => setScreen("main")} onSave={(s) => { if (s.pushEnabled !== undefined) setPushNotifications(s.pushEnabled); }} /></AppShell>;
  if (screen === "groupSettings" || screen === "settings") return <AppShell><SettingsScreen monthlyBudget={monthlyBudget} onSetBudget={updateBudget} currency={currency} onSetCurrency={updateCurrency} autoReminders={autoReminders} onToggleReminders={() => setAutoReminders(!autoReminders)} privacyMode={privacyMode} onTogglePrivacy={() => setPrivacyMode(!privacyMode)} offlineMode={offlineMode} onToggleOffline={() => setOfflineMode(!offlineMode)} pushNotifications={pushNotifications} onTogglePushNotifications={() => setPushNotifications(!pushNotifications)} reminderDelay={reminderDelay} onSetReminderDelay={(d: number) => setReminderDelay(d)} onClearData={() => { localStorage.clear(); window.location.reload(); }} biometricEnabled={!!biometricEnabled[currentMemberId]} onToggleBiometric={toggleBiometric} onBack={() => setScreen("main")} /></AppShell>;
  if (screen === "members") return <AppShell><MemberManagement members={members} currentMemberId={currentMemberId} expenses={expenses} pendingRequests={pendingMembers.map(m => ({ id: `pending_${m.id}`, memberId: m.id, memberName: m.name, memberAvatar: m.avatar, requestedAt: 0 }))} onChangeRole={(id, role) => { setMembers((prev) => prev.map((m) => m.id === id ? { ...m, role } : m)); changeMemberRoleMutation.mutate({ memberId: id, role: role as "admin" | "member" }); }} onRemoveMember={removeMember} onAddMember={() => addMember("Nouveau", "👤")} onApproveMember={approveMember} onRefuseMember={refuseMemberCb} onBack={() => setScreen("main")} onUpdateGroupSettings={(settings) => { updateGroupSettingsMutation.mutate(settings); toast.success("Paramètres mis à jour"); }} onResetAllData={async () => { try { await resetAllDataMutation.mutateAsync(); setMembers([]); setExpenses([]); setPendingPayments([]); setCompletedPayments([]); setScreen("identity"); toast.success("Toutes les données ont été réinitialisées"); } catch { toast.error("Erreur lors de la réinitialisation"); } }} groupName="Équilibra Groupe" groupRequireApproval={requireApproval} /></AppShell>;
  if (screen === "reports") return <AppShell><ReportsScreen expenses={expenses} members={members} pendingPayments={pendingPayments} completedPayments={completedPayments} monthlyBudget={monthlyBudget} onBack={() => setScreen("main")} /></AppShell>;
  if (!currentMember) return <AppShell><div className="flex items-center justify-center h-screen"><p className="text-muted-foreground">Chargement...</p></div></AppShell>;

  // ─── Main View ─────────────────────────────────────────────
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const myBalance = balances[currentMemberId] || 0;
  const recentExpenses = [...expenses].sort((a, b) => b.date - a.date).slice(0, 5);
  const myPendingPayments = pendingPayments.filter((p) => p.toId === currentMemberId && (p.status === "pending" || p.status === "late"));
  const myCompletedPayments = completedPayments.filter((p) => p.toId === currentMemberId || p.fromId === currentMemberId);

  return (
    <AppShell>
      <div className="min-h-screen pb-24">
        <AnimatePresence mode="wait">
          {activeTab === "home" && <HomeTab key="home" currentMember={currentMember} balance={myBalance} totalSpent={totalSpent} expenseCount={expenses.length} recentExpenses={recentExpenses} members={members} pendingPayments={myPendingPayments} completedPayments={myCompletedPayments} onConfirmPayment={confirmPayment} onRefusePayment={refusePayment} onResentPayment={resentPayment} onConfirmReceipt={confirmReceipt} onReportNotReceived={reportNotReceived} expenses={expenses} monthlyBudget={monthlyBudget} onUpdateBudget={updateBudget} />}
          {activeTab === "expenses" && <ExpensesTab key="expenses" expenses={expenses} members={members} currentMemberId={currentMemberId} onDelete={deleteExpense} onAdd={() => setShowAddExpense(true)} onRequestPayment={requestPayment} onRequestGroupPayment={requestGroupPayment} />}
          {activeTab === "balances" && <BalancesTab key="balances" members={members} balances={balances} suggestedTransactions={suggestedTransactions} currentMemberId={currentMemberId} onRequestPayment={(toId, amount) => requestPayment(toId, amount)} expenses={expenses} />}
          {activeTab === "history" && <PaymentHistory key="history" payments={[...completedPayments, ...pendingPayments].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))} expenses={expenses} members={members} currentMemberId={currentMemberId} />}
          {activeTab === "stats" && <StatsTab key="stats" expenses={expenses} members={members} currentMemberId={currentMemberId} pendingPayments={pendingPayments} completedPayments={completedPayments} monthlyBudget={monthlyBudget} />}
          {activeTab === "profile" && <ProfileTab key="profile" currentMember={currentMember} members={members} biometricEnabled={!!biometricEnabled[currentMemberId]} biometricAvailable={biometricAvailable} onToggleBiometric={toggleBiometric} onLogout={() => { setCurrentMemberId(""); setScreen("identity"); }} onRemoveMember={removeMember} isLocked={!!localStorage.getItem("equilibra_locked_member")} unreadCount={unreadCount} onOpenNotifications={() => setScreen("notifications")} onOpenReports={() => setScreen("reports")} onOpenGroupSettings={() => setScreen("groupSettings")} onOpenMembers={() => setScreen("members")} onResetAllData={async () => { try { await resetAllDataMutation.mutateAsync(); setMembers([]); setExpenses([]); setPendingPayments([]); setCompletedPayments([]); setScreen("identity"); toast.success("Toutes les données ont été réinitialisées"); } catch { toast.error("Erreur lors de la réinitialisation"); } }} onLeaveGroup={leaveGroup} />}
        </AnimatePresence>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-card/80 backdrop-blur-xl border-t border-border">
          <div className="max-w-md mx-auto flex items-center justify-around py-2">
            {([["home", Home, "Accueil"], ["expenses", Receipt, "Dépenses"], ["balances", Scale, "Soldes"], ["history", History, "Historique"], ["stats", BarChart3, "Stats"], ["profile", User, "Profil"]] as [Tab, typeof Home, string][]).map(([tab, Icon, label]) => (
              <motion.button key={tab} whileTap={{ scale: 0.9 }} onClick={() => setActiveTab(tab)} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${activeTab === tab ? "text-primary" : "text-muted-foreground"}`}>
                <Icon size={20} strokeWidth={activeTab === tab ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium">{label}</span>
              </motion.button>
            ))}
          </div>
        </nav>

        {/* Floating Add Button */}
        {activeTab === "expenses" && (
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowAddExpense(true)} className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
            <Plus size={24} />
          </motion.button>
        )}

        {showAddExpense && <AddExpenseSheet members={members} currentMemberId={currentMemberId} onAdd={(e) => { addExpense(e); setShowAddExpense(false); }} onClose={() => setShowAddExpense(false)} customCategories={categories.length > 0 ? categories : undefined} />}
      </div>
    </AppShell>
  );
}
