import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Receipt, Scale, History, BarChart3, User, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

import type { Member, Expense, PendingPayment, Notification, Screen, Tab } from "./types";
import { GROUP_ID } from "./constants";
import { formatCurrency } from "./utils/currency";
import { simplifyDebts } from "./utils/debts";
import { checkBiometricAvailable, registerBiometric, authenticateBiometric } from "./utils/biometric";
import { storePhotoAvatar } from "./utils/avatarStorage";
import { ThemeProvider } from "./contexts/ThemeContext";
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
import AppearanceScreen from "./components/AppearanceScreen";
import { MemberManagement } from "./components/MemberManagement";
import { ReportsScreen } from "./components/ReportsScreen";
import { RegisterScreen } from "./components/RegisterScreen";
import { InviteScreen } from "./components/InviteScreen";
import { EditProfileScreen } from "./components/EditProfileScreen";

const isNetlify = import.meta.env.VITE_NETLIFY === "true";

function prepareAvatar(memberId: string, avatar: string): string {
  if (avatar.startsWith("data:")) {
    storePhotoAvatar(memberId, avatar);
    return avatar;
  }
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
  const reportNotReceivedMutation = trpc.equilibra.reportNotReceived.useMutation();
  const resendPaymentRequestMutation = trpc.equilibra.resendPaymentRequest.useMutation();
  const markAsPaidMutation = trpc.equilibra.markAsPaid.useMutation();
  const updateNotificationSettingsMutation = trpc.equilibra.updateNotificationSettings.useMutation();
  const updateMemberProfileMutation = trpc.equilibra.updateMemberProfile.useMutation();

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

  // ─── Sync notification settings to server ─────────────────
  const notifSettingsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isNetlify || !currentMemberId) return;
    if (notifSettingsTimerRef.current) clearTimeout(notifSettingsTimerRef.current);
    notifSettingsTimerRef.current = setTimeout(() => {
      updateNotificationSettingsMutation.mutate({
        memberId: currentMemberId,
        pushEnabled: pushNotifications,
        reminderFrequency: reminderDelay + "h",
      });
    }, 1000);
    return () => { if (notifSettingsTimerRef.current) clearTimeout(notifSettingsTimerRef.current); };
  }, [pushNotifications, reminderDelay, autoReminders, currentMemberId, isNetlify]);

  useEffect(() => { checkBiometricAvailable().then(setBiometricAvailable); }, []);

  useEffect(() => {
    const v = localStorage.getItem("equilibra_monthly_budget");
    if (v) setMonthlyBudget(parseFloat(v));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");
    if (invite) {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith("equilibra_")) localStorage.removeItem(k);
      });
      setInviteToken(invite);
      setScreen("invite");
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }
    if (!accessCode) setScreen("access");
  }, []);

  useEffect(() => {
    if (syncingFromServer.current) { syncingFromServer.current = false; return; }
    if (!isNetlify && members.length > 0) {
      initGroup.mutateAsync({ members: members.map(m => ({ id: m.id, name: m.name, avatar: m.avatar, role: m.role as "admin" | "member" | undefined, status: m.status as "active" | "pending" | undefined })) }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNetlify, members]);

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
        if (data.members) {
          const migrated = data.members.map((m: any) => {
            if (m.avatar && m.avatar.startsWith("data:")) {
              storePhotoAvatar(m.id, m.avatar);
              return { ...m, avatar: `photo:${m.id}` };
            }
            return m;
          });
          setMembers(migrated);
        }
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
      setMembers(groupData.members.map((m: any) => {
        let avatar = m.avatar;
        if (avatar && avatar.startsWith("data:")) {
          storePhotoAvatar(m.id, avatar);
          avatar = `photo:${m.id}`;
        }
        return { id: m.id, name: m.name, avatar, role: m.role, status: m.status };
      }));
    }
    if (groupData.expenses) setExpenses(groupData.expenses);
    if (groupData.pending) setPendingPayments(groupData.pending);
    if (groupData.history) setCompletedPayments(groupData.history);
    if (groupData.requireApproval !== undefined) setRequireApproval(groupData.requireApproval);
    if (groupData.pinCode) setGroupPin(groupData.pinCode);
  }, [groupData]);

  useEffect(() => {
    try {
      localStorage.setItem("equilibra_data", JSON.stringify({ members, expenses, pendingPayments, currentMemberId, biometricEnabled, completedPayments }));
    } catch {}
  }, [members, expenses, pendingPayments, currentMemberId, biometricEnabled, completedPayments]);

  useEffect(() => {
    try {
      localStorage.setItem("equilibra_auto_reminders", String(autoReminders));
      localStorage.setItem("equilibra_privacy_mode", String(privacyMode));
      localStorage.setItem("equilibra_offline_mode", String(offlineMode));
      localStorage.setItem("equilibra_push_notifications", String(pushNotifications));
      localStorage.setItem("equilibra_reminder_delay", String(reminderDelay));
    } catch {}
  }, [autoReminders, privacyMode, offlineMode, pushNotifications, reminderDelay]);

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

  // ─── Auto-Reminder System ─────────────────────────────────
  useEffect(() => {
    if (!autoReminders || isNetlify) return;
    const intervalMs = reminderDelay * 60 * 60 * 1000; // reminderDelay is in hours
    const interval = setInterval(() => {
      if (!currentMemberId) return;
      const now = Date.now();
      pendingPayments.forEach((p) => {
        if (p.fromId === currentMemberId && (p.status === "pending" || p.status === "accepted")) {
          const elapsed = now - (p.createdAt || 0);
          if (elapsed >= intervalMs) {
            resendPaymentRequestMutation.mutateAsync({
              paymentId: p.id,
              toId: p.toId,
              amount: p.amount,
            }).catch(() => {});
          }
        }
      });
    }, Math.min(intervalMs, 60000)); // Check every minute (or at the delay interval if shorter)
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoReminders, reminderDelay, isNetlify, currentMemberId, pendingPayments]);

  // ─── Refetch on window focus ──────────────────────────────
  useEffect(() => {
    if (isNetlify) return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isNetlify]);

  // ─── Computed ──────────────────────────────────────────────
  const balances = useMemo(() => {
    const b: Record<string, number> = {};
    members.forEach((m) => { b[m.id] = 0; });
    expenses.forEach((e) => {
      if (!e.participants.length) return;
      const share = e.amount / e.participants.length;
      e.participants.forEach((pid) => { if (b[pid] !== undefined) b[pid] -= share; });
      if (b[e.payerId] !== undefined) b[e.payerId] += e.amount;
    });
    completedPayments.forEach((p) => {
      if (p.status === "completed" || p.status === "paid") {
        if (b[p.fromId] !== undefined) b[p.fromId] -= p.amount;
        if (b[p.toId] !== undefined) b[p.toId] += p.amount;
      }
    });
    return b;
  }, [members, expenses, completedPayments]);

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
    if (stored && stored !== id) {
      const lockedMember = members.find((m) => m.id === stored);
      if (!lockedMember) { localStorage.removeItem("equilibra_locked_member"); } else { showNotification("Accès verrouillé", `Compte verrouillé sur ${lockedMember.name}`); return; }
    }
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

  const requestPayment = useCallback(async (toId: string, amount: number, expenseId?: string, note?: string) => {
    if (!currentMemberId) return;
    haptic("success");
    const toName = members.find((m) => m.id === toId)?.name || "";
    const payment: PendingPayment = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, fromId: currentMemberId, fromName: members.find((m) => m.id === currentMemberId)?.name || "",
      toId, toName, amount, status: "pending",
      createdAt: Date.now(), notificationSent: false, notificationCount: 0, expenseId, requestNote: note,
    };
    setPendingPayments((prev) => [...prev, payment]);
    showNotification("Demande envoyée", `Demande de ${formatCurrency(amount)} à ${toName}`);
    toast.success(`Demande de ${formatCurrency(amount)} envoyée à ${toName}`);
    if (!isNetlify) { try { await requestPaymentMutation.mutateAsync({ ...payment, groupId: GROUP_ID }); await refetch(); } catch (e) { toast.error("Erreur lors de l'envoi de la demande"); } }
  }, [currentMemberId, members, haptic, requestPaymentMutation, refetch, showNotification, isNetlify]);

  const requestGroupPayment = useCallback(async (expenseId: string, participantIds?: string[], note?: string) => {
    const expense = expenses.find((e) => e.id === expenseId);
    if (!expense) return;
    const ids = participantIds || expense.participants.filter((p) => p !== currentMemberId);
    const perPerson = expense.amount / expense.participants.length;
    haptic("success");
    const promises = ids.map((pid) => requestPayment(pid, perPerson, expenseId, note));
    await Promise.all(promises);
    toast.success(`${ids.length} demande(s) envoyée(s) pour ${expense.description}`);
  }, [expenses, currentMemberId, requestPayment, haptic]);

  const confirmPayment = useCallback((id: string) => {
    haptic("success");
    const payment = pendingPayments.find((p) => p.id === id);
    setPendingPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: "accepted" as const, respondedAt: Date.now() } : p));
    if (payment) toast.success(`Paiement de ${formatCurrency(payment.amount)} accepté`);
    if (!isNetlify && payment) {
      confirmPaymentMutation.mutateAsync({ paymentId: id, fromId: payment.fromId, toId: payment.toId, amount: payment.amount })
        .then(() => refetch())
        .catch(() => {});
    }
  }, [haptic, isNetlify, pendingPayments, confirmPaymentMutation, refetch]);

  const refusePayment = useCallback((id: string, comment?: string) => {
    haptic("medium");
    const payment = pendingPayments.find((p) => p.id === id);
    setPendingPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: "refused" as const, respondedAt: Date.now(), comment } : p));
    if (payment) toast.info(`Paiement de ${formatCurrency(payment.amount)} refusé`);
    if (!isNetlify && payment) {
      refusePaymentMutation.mutateAsync({ paymentId: id, fromId: payment.fromId, comment })
        .then(() => refetch())
        .catch(() => {});
    }
  }, [haptic, isNetlify, pendingPayments, refusePaymentMutation, refetch]);

  const resentPayment = useCallback((id: string) => {
    haptic("light");
    const payment = pendingPayments.find((p) => p.id === id);
    setPendingPayments((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const attempts = (p.attemptCount || 0) + 1;
      if (attempts >= 3) return { ...p, status: "late" as const, attemptCount: attempts, notificationCount: (p.notificationCount || 0) + 1 };
      return { ...p, notificationCount: (p.notificationCount || 0) + 1, attemptCount: attempts };
    }));
    if (payment) toast.success(`Rappel envoyé à ${payment.toName}`);
    if (!isNetlify && payment) {
      resendPaymentRequestMutation.mutateAsync({ paymentId: id, toId: payment.toId, amount: payment.amount })
        .then(() => refetch())
        .catch(() => {});
    }
  }, [haptic, isNetlify, pendingPayments, resendPaymentRequestMutation, refetch]);

  const confirmReceipt = useCallback((id: string) => {
    haptic("success");
    const payment = pendingPayments.find((p) => p.id === id);
    if (payment) {
      setCompletedPayments((prev) => [...prev, { ...payment, status: "completed" as const, completedAt: Date.now() }]);
      setPendingPayments((prev) => prev.filter((p) => p.id !== id));
      toast.success(`Paiement de ${formatCurrency(payment.amount)} confirmé comme reçu`);
    }
    if (!isNetlify && payment) {
      confirmReceiptMutation.mutateAsync({ paymentId: id, toId: payment.toId })
        .then(() => refetch())
        .catch(() => {});
    }
  }, [haptic, pendingPayments, confirmReceiptMutation, refetch, isNetlify]);

  const reportNotReceived = useCallback((id: string, comment?: string) => {
    haptic("medium");
    const payment = pendingPayments.find((p) => p.id === id);
    setPendingPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: "disputed" as const, disputeNote: comment } : p));
    if (payment) toast.error(`Litige ouvert pour ${formatCurrency(payment.amount)}`);
    if (!isNetlify && payment && comment) {
      reportNotReceivedMutation.mutateAsync({ paymentId: id, note: comment, toId: payment.toId })
        .then(() => refetch())
        .catch(() => {});
    }
  }, [haptic, isNetlify, pendingPayments, reportNotReceivedMutation, refetch]);

  const markAsPaid = useCallback((id: string) => {
    haptic("success");
    const payment = pendingPayments.find((p) => p.id === id);
    setPendingPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: "paid" as const } : p));
    if (payment) toast.success(`Paiement de ${formatCurrency(payment.amount)} marqué comme payé`);
    if (!isNetlify && payment) {
      markAsPaidMutation.mutateAsync({ paymentId: id, fromId: payment.fromId })
        .then(() => refetch())
        .catch(() => {});
    }
  }, [haptic, isNetlify, pendingPayments, markAsPaidMutation, refetch]);

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
    const prevMembers = members;
    const prevExpenses = expenses;
    const prevCurrentMemberId = currentMemberId;
    const prevScreen = screen;
    setMembers(prev => prev.filter(m => m.id !== currentMemberId));
    setExpenses(prev => prev.filter(e => e.payerId !== currentMemberId));
    setCurrentMemberId("");
    setScreen("identity");
    if (!isNetlify) {
      try {
        await leaveMemberMutation.mutateAsync({ memberId: currentMemberId });
        await refetch();
      } catch {
        setMembers(prevMembers);
        setExpenses(prevExpenses);
        setCurrentMemberId(prevCurrentMemberId);
        setScreen(prevScreen);
        toast.error("Erreur lors de la sortie du groupe");
      }
    }
  }, [currentMember, currentMemberId, leaveMemberMutation, refetch, isNetlify, members, expenses, screen]);

  const [profileSaving, setProfileSaving] = useState(false);
  const handleUpdateProfile = useCallback(async (name: string, rawAvatar: string) => {
    setProfileSaving(true);
    try {
      const avatar = prepareAvatar(currentMemberId, rawAvatar);
      setMembers((prev) => prev.map((m) => m.id === currentMemberId ? { ...m, name, avatar } : m));
      if (!isNetlify) {
        await updateMemberProfileMutation.mutateAsync({ memberId: currentMemberId, name, avatar });
        await refetch();
      }
      setScreen("main");
      toast.success("Profil mis à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setProfileSaving(false);
    }
  }, [currentMemberId, isNetlify, updateMemberProfileMutation, refetch]);

  // ─── Screen Routing ────────────────────────────────────────
  const themed = (content: React.ReactNode) => <ThemeProvider memberId={currentMemberId}>{content}</ThemeProvider>;
  if (screen === "access") return themed(<AppShell><AccessScreen onSubmit={handleAccessCode} /></AppShell>);
  if (screen === "identity") {
    if (members.length === 0) return themed(<AppShell><RegisterScreen onRegister={(name, rawAvatar) => {
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
    }} onBack={() => setScreen("access")} groupName="Équilibra" /></AppShell>);
    return themed(<AppShell><IdentityScreen members={members} onSelect={selectIdentity} onReset={async () => { try { await resetAllDataMutation.mutateAsync(); setMembers([]); setExpenses([]); setPendingPayments([]); setCompletedPayments([]); toast.success("Groupe réinitialisé"); } catch { toast.error("Erreur lors de la réinitialisation"); } }} /></AppShell>);
  }
  if (screen === "register") return themed(<AppShell><RegisterScreen onRegister={handleRegister} onBack={() => setScreen("access")} /></AppShell>);
  if (screen === "invite") return themed(<AppShell><InviteScreen inviteToken={inviteToken!} onJoinByInvite={async (name, rawAvatar) => {
    const memberId = Date.now().toString();
    const avatar = prepareAvatar(memberId, rawAvatar);
    try {
      const r = await joinGroupByInviteMutation.mutateAsync({ token: inviteToken!, memberId, memberName: name, memberAvatar: avatar });
      if (r?.success) {
        await refetch();
        const status = r.requiresApproval ? "pending" : "active";
        const newMember: Member = { id: memberId, name, avatar, role: "member", status };
        setMembers((prev) => [...prev, newMember]);
        setCurrentMemberId(memberId);
        if (r.requiresApproval) { setScreen("identity"); toast.info("Votre demande est en attente d'approbation par l'admin."); }
        else { setScreen("main"); }
      }
      return r ?? { success: false };
    } catch { return { success: false, error: "Erreur de connexion" }; }
  }} onBack={() => setScreen("access")} /></AppShell>);
  if (screen === "lock" && currentMember) return themed(<AppShell><LockScreen member={currentMember} onUnlock={handleBiometricUnlock} onSkip={() => setScreen("main")} onSwitchIdentity={() => setScreen("identity")} /></AppShell>);
  if (screen === "notifications") return themed(<AppShell><NotificationsScreen notifications={notifications} currentMemberId={currentMemberId} onBack={() => setScreen("main")} onMarkRead={(id) => markNotificationReadMutation.mutate({ notificationId: id })} onMarkAllRead={() => markAllNotificationsReadMutation.mutate({ memberId: currentMemberId })} /></AppShell>);
  if (screen === "notificationSettings") return themed(<AppShell><NotificationSettingsScreen settings={{ pushEnabled: pushNotifications, emailEnabled: false, reminderFrequency: reminderDelay.toString() + "h" }} onBack={() => setScreen("main")} onSave={(s) => { if (s.pushEnabled !== undefined) setPushNotifications(s.pushEnabled); if (s.reminderFrequency) { const hours = parseInt(s.reminderFrequency); if (!isNaN(hours)) setReminderDelay(hours); } }} /></AppShell>);
  if (screen === "groupSettings" || screen === "settings") return themed(<AppShell><SettingsScreen monthlyBudget={monthlyBudget} onSetBudget={updateBudget} currency={currency} onSetCurrency={updateCurrency} autoReminders={autoReminders} onToggleReminders={() => setAutoReminders(!autoReminders)} privacyMode={privacyMode} onTogglePrivacy={() => setPrivacyMode(!privacyMode)} offlineMode={offlineMode} onToggleOffline={() => setOfflineMode(!offlineMode)} pushNotifications={pushNotifications} onTogglePushNotifications={() => setPushNotifications(!pushNotifications)} reminderDelay={reminderDelay} onSetReminderDelay={(d: number) => setReminderDelay(d)} onClearData={() => { Object.keys(localStorage).forEach(k => { if (k.startsWith("equilibra_")) localStorage.removeItem(k); }); window.location.reload(); }} biometricEnabled={!!biometricEnabled[currentMemberId]} onToggleBiometric={toggleBiometric} onBack={() => setScreen("main")} /></AppShell>);
  if (screen === "members") return themed(<AppShell><MemberManagement members={members} currentMemberId={currentMemberId} expenses={expenses} pendingRequests={pendingMembers.map(m => ({ id: `pending_${m.id}`, memberId: m.id, memberName: m.name, memberAvatar: m.avatar, requestedAt: 0 }))} onChangeRole={(id, role) => { setMembers((prev) => prev.map((m) => m.id === id ? { ...m, role } : m)); changeMemberRoleMutation.mutate({ memberId: id, role: role as "admin" | "member" }); }} onRemoveMember={removeMember} onAddMember={() => addMember("Nouveau", "👤")} onApproveMember={approveMember} onRefuseMember={refuseMemberCb} onBack={() => setScreen("main")} onUpdateGroupSettings={(settings) => { updateGroupSettingsMutation.mutate(settings); toast.success("Paramètres mis à jour"); }} onResetAllData={async () => { try { await resetAllDataMutation.mutateAsync(); setMembers([]); setExpenses([]); setPendingPayments([]); setCompletedPayments([]); setScreen("identity"); toast.success("Toutes les données ont été réinitialisées"); } catch { toast.error("Erreur lors de la réinitialisation"); } }} groupName="Équilibra Groupe" groupRequireApproval={requireApproval} /></AppShell>);
  if (screen === "appearance") return themed(<AppShell><AppearanceScreen onBack={() => setScreen("main")} /></AppShell>);
  if (screen === "editProfile" && currentMember) return themed(<AppShell><EditProfileScreen currentName={currentMember.name} currentAvatar={currentMember.avatar} onSave={handleUpdateProfile} onBack={() => setScreen("main")} saving={profileSaving} /></AppShell>);
  if (screen === "reports") return themed(<AppShell><ReportsScreen expenses={expenses} members={members} pendingPayments={pendingPayments} completedPayments={completedPayments} monthlyBudget={monthlyBudget} onBack={() => setScreen("main")} /></AppShell>);
  if (!currentMember) return themed(<AppShell><div className="flex items-center justify-center h-screen"><p className="text-muted-foreground">Chargement...</p></div></AppShell>);

  // ─── Main View ─────────────────────────────────────────────
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const myBalance = balances[currentMemberId] || 0;
  const recentExpenses = [...expenses].sort((a, b) => b.date - a.date).slice(0, 5);
  const myPendingPayments = pendingPayments.filter((p) => (p.toId === currentMemberId || p.fromId === currentMemberId) && (p.status === "pending" || p.status === "late" || p.status === "refused" || p.status === "disputed"));
  const myCompletedPayments = completedPayments.filter((p) => p.toId === currentMemberId || p.fromId === currentMemberId);

  return themed(
    <AppShell>
      <div className="min-h-screen pb-24">
        <AnimatePresence mode="wait">
          {activeTab === "home" && <HomeTab key="home" currentMember={currentMember} balance={myBalance} totalSpent={totalSpent} expenseCount={expenses.length} recentExpenses={recentExpenses} members={members} pendingPayments={myPendingPayments} completedPayments={myCompletedPayments} onConfirmPayment={confirmPayment} onRefusePayment={refusePayment} onResentPayment={resentPayment} onConfirmReceipt={confirmReceipt} onReportNotReceived={reportNotReceived} onMarkAsPaid={markAsPaid} expenses={expenses} monthlyBudget={monthlyBudget} currency={currency} onUpdateBudget={updateBudget} />}
          {activeTab === "expenses" && <ExpensesTab key="expenses" expenses={expenses} members={members} currentMemberId={currentMemberId} onDelete={deleteExpense} onAdd={() => setShowAddExpense(true)} onRequestPayment={requestPayment} onRequestGroupPayment={requestGroupPayment} currency={currency} pendingPayments={pendingPayments} completedPayments={completedPayments} />}
          {activeTab === "balances" && <BalancesTab key="balances" members={members} balances={balances} suggestedTransactions={suggestedTransactions} currentMemberId={currentMemberId} onRequestPayment={(toId, amount, note) => requestPayment(toId, amount, undefined, note)} expenses={expenses} currency={currency} />}
          {activeTab === "history" && <PaymentHistory key="history" payments={[...completedPayments, ...pendingPayments].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))} expenses={expenses} members={members} currentMemberId={currentMemberId} currency={currency} />}
          {activeTab === "stats" && <StatsTab key="stats" expenses={expenses} members={members} currentMemberId={currentMemberId} pendingPayments={pendingPayments} completedPayments={completedPayments} monthlyBudget={monthlyBudget} currency={currency} />}
          {activeTab === "profile" && <ProfileTab key="profile" currentMember={currentMember} members={members} biometricEnabled={!!biometricEnabled[currentMemberId]} biometricAvailable={biometricAvailable} onToggleBiometric={toggleBiometric} onLogout={() => { setCurrentMemberId(""); setScreen("identity"); }} onRemoveMember={removeMember} isLocked={!!localStorage.getItem("equilibra_locked_member")} unreadCount={unreadCount} onOpenNotifications={() => setScreen("notifications")} onOpenReports={() => setScreen("reports")} onOpenGroupSettings={() => setScreen("groupSettings")} onOpenMembers={() => setScreen("members")} onOpenAppearance={() => setScreen("appearance")} onOpenEditProfile={() => setScreen("editProfile")} onResetAllData={async () => { try { await resetAllDataMutation.mutateAsync(); setMembers([]); setExpenses([]); setPendingPayments([]); setCompletedPayments([]); setScreen("identity"); toast.success("Toutes les données ont été réinitialisées"); } catch { toast.error("Erreur lors de la réinitialisation"); } }} onLeaveGroup={leaveGroup} currency={currency} onSetCurrency={updateCurrency} monthlyBudget={monthlyBudget} onSetBudget={updateBudget} pushNotifications={pushNotifications} onTogglePushNotifications={() => setPushNotifications(!pushNotifications)} autoReminders={autoReminders} onToggleReminders={() => setAutoReminders(!autoReminders)} reminderDelay={reminderDelay} onSetReminderDelay={(d: number) => setReminderDelay(d)} privacyMode={privacyMode} onTogglePrivacy={() => setPrivacyMode(!privacyMode)} />}
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

        {showAddExpense && <AddExpenseSheet members={members} currentMemberId={currentMemberId} onAdd={(e) => { addExpense(e); setShowAddExpense(false); }} onClose={() => setShowAddExpense(false)} currency={currency} />}
      </div>
    </AppShell>
  );
}
