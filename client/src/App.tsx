import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from "react";
import { Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

import type { Member, Expense, PendingPayment, Notification, Screen, Tab } from "./types";
import { GROUP_ID, MAIN_TUTORIAL_ID } from "./constants";
import { formatCurrency } from "./utils/currency";
import { simplifyDebts } from "./utils/debts";
import { checkBiometricAvailable, registerBiometric, authenticateBiometric } from "./utils/biometric";
import { storePhotoAvatar } from "./utils/avatarStorage";
import { subscribeToPush, unsubscribeFromPush, getCurrentPushSubscription } from "./utils/pushSubscription";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useNotifications } from "./hooks/useNotifications";
import { useHaptic } from "./hooks/useHaptic";
import { isTutorialCompleted } from "./utils/tutorialStorage";
import { GuidedTour } from "./components/GuidedTour";
import { ALL_TUTORIALS } from "./utils/tutorialSteps";
import { OnboardingScreen, hasCompletedOnboarding } from "./components/OnboardingScreen";

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
import { ThemeToaster } from "./components/ThemeToaster";
import { AddExpenseSheet } from "./components/AddExpenseSheet";
import { RegisterScreen } from "./components/RegisterScreen";
import { InviteScreen } from "./components/InviteScreen";
import { SplashScreen } from "./components/SplashScreen";
import { TabContentSkeleton } from "./components/SkeletonLoaders";
import { ErrorBoundary } from "./components/ErrorBoundary";

const AppearanceScreen = lazy(() => import("./components/AppearanceScreen"));
const CategoryManagementScreen = lazy(() => import("./components/CategoryManagementScreen").then(m => ({ default: m.CategoryManagementScreen })));
const ReportsScreen = lazy(() => import("./components/ReportsScreen").then(m => ({ default: m.ReportsScreen })));
const MemberManagement = lazy(() => import("./components/MemberManagement").then(m => ({ default: m.MemberManagement })));
const SettingsScreen = lazy(() => import("./components/SettingsScreen").then(m => ({ default: m.SettingsScreen })));
const PaymentHistory = lazy(() => import("./components/PaymentHistory").then(m => ({ default: m.PaymentHistory })));
const EditProfileScreen = lazy(() => import("./components/EditProfileScreen").then(m => ({ default: m.EditProfileScreen })));

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
 const [activeTab, setActiveTab] = useState<Tab>(() => {
 const saved = localStorage.getItem("equilibra_active_tab");
 return (saved === "home" || saved === "expenses" || saved === "balances" || saved === "stats" || saved === "profile" || saved === "history") ? saved : "home";
 });
 const [showAddExpense, setShowAddExpense] = useState(false);
 const [duplicateFrom, setDuplicateFrom] = useState<Expense | null>(null);
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
 const [showSplash, setShowSplash] = useState(true);
 const [showOnboarding, setShowOnboarding] = useState(() => !hasCompletedOnboarding());
 const [serverWaking, setServerWaking] = useState(false);
 const [serverWakeRetries, setServerWakeRetries] = useState(0);
 const [activeTutorial, setActiveTutorial] = useState<string | null>(null);

 const { permission: notificationPermission, requestPermission, showNotification } = useNotifications();
 const haptic = useHaptic();

 const currentMember = useMemo(() => members.find((m) => m.id === currentMemberId), [members, currentMemberId]);
 const pendingMembers = useMemo(() => members.filter(m => m.status === "pending"), [members]);
 const recentExpenses = useMemo(() => [...expenses].sort((a, b) => b.date - a.date).slice(0, 5), [expenses]);
 const myPendingPayments = useMemo(() => pendingPayments.filter((p) => (p.toId === currentMemberId || p.fromId === currentMemberId) && (p.status === "pending" || p.status === "late" || p.status === "refused" || p.status === "disputed" || p.status === "paid" || p.status === "accepted")), [pendingPayments, currentMemberId]);
 const myCompletedPayments = useMemo(() => completedPayments.filter((p) => p.toId === currentMemberId || p.fromId === currentMemberId), [completedPayments, currentMemberId]);

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
 const cancelPaymentRequestMutation = trpc.equilibra.cancelPaymentRequest.useMutation();
 const updateNotificationSettingsMutation = trpc.equilibra.updateNotificationSettings.useMutation();
 const updateMemberProfileMutation = trpc.equilibra.updateMemberProfile.useMutation();
 const updateMemberBiometricMutation = trpc.equilibra.updateMemberBiometric.useMutation();
 const addMemberDirectMutation = trpc.equilibra.addMemberDirect.useMutation();
 const vapidPublicKeyQuery = trpc.equilibra.getVapidPublicKey.useQuery(undefined, { enabled: !isNetlify, staleTime: 3600000 });
 const subscribePushMutation = trpc.equilibra.subscribePush.useMutation();
 const unsubscribePushMutation = trpc.equilibra.unsubscribePush.useMutation();

 const { data: groupData, refetch, isLoading: isGroupLoading, isError: isGroupError, error: groupError } = trpc.equilibra.getGroupData.useQuery(undefined, {
 enabled: !isNetlify,
 refetchInterval: 10000,
 retry: 3,
 retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
 refetchOnWindowFocus: true,
 staleTime: 30000,
 gcTime: 300000,
 });
 const getNotificationsQuery = trpc.equilibra.getNotifications.useQuery({ memberId: currentMemberId }, { enabled: !!currentMemberId && !isNetlify, refetchInterval: 5000, staleTime: 5000 });
 const getCategoriesQuery = trpc.equilibra.getCategories.useQuery(undefined, { enabled: !isNetlify, staleTime: 60000, gcTime: 600000 });

 // ─── Effects ───────────────────────────────────────────────
 // Keep Render server awake by pinging API every 5 minutes
 useEffect(() => {
  if (isNetlify) return;
  const ping = () => fetch("/api/trpc/equilibra.getGroupData?input=%7B%7D", { cache: "no-store" }).catch(() => {});
  ping();
  const interval = setInterval(ping, 60 * 1000);
  return () => clearInterval(interval);
 }, [isNetlify]);

 useEffect(() => {
  if (isNetlify || !isGroupError) return;
 setServerWaking(true);
 const timer = setTimeout(() => {
 setServerWakeRetries(prev => prev + 1);
 refetch();
 }, Math.min(3000 * (serverWakeRetries + 1), 15000));
 return () => clearTimeout(timer);
 }, [isGroupError, serverWakeRetries, isNetlify, refetch]);

 useEffect(() => {
 if (groupData) setServerWaking(false);
 }, [groupData]);

 useEffect(() => {
 if (notificationPermission === "default") {
 const handler = () => { requestPermission(); };
 document.addEventListener("click", handler, { once: true });
 document.addEventListener("touchstart", handler, { once: true });
 return () => { document.removeEventListener("click", handler); document.removeEventListener("touchstart", handler); };
 }
 }, [notificationPermission, requestPermission]);

 // Auto-subscribe to push notifications if enabled
 useEffect(() => {
   if (isNetlify || !pushNotifications || !currentMemberId || !vapidPublicKeyQuery.data?.publicKey) return;
   let cancelled = false;
   (async () => {
     const existing = await getCurrentPushSubscription();
     if (cancelled) return;
     if (!existing) {
       const sub = await subscribeToPush(vapidPublicKeyQuery.data!.publicKey, currentMemberId);
       if (!cancelled && sub) {
         subscribePushMutation.mutate({
           memberId: currentMemberId,
           subscription: sub,
           userAgent: navigator.userAgent,
         });
       }
     }
   })();
   return () => { cancelled = true; };
 }, [pushNotifications, currentMemberId, vapidPublicKeyQuery.data]);

 // Listen for push subscription changes from Service Worker
 useEffect(() => {
   if (!('serviceWorker' in navigator)) return;
   const handler = (event: MessageEvent) => {
     if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGED' && event.data.subscription && currentMemberId) {
       const sub = event.data.subscription;
       if (sub.endpoint && sub.keys) {
         subscribePushMutation.mutate({
           memberId: currentMemberId,
           subscription: { endpoint: sub.endpoint, p256dh: sub.keys.p256dh || '', auth: sub.keys.auth || '' },
           userAgent: navigator.userAgent,
         });
       }
     }
   };
   navigator.serviceWorker.addEventListener('message', handler);
   return () => navigator.serviceWorker.removeEventListener('message', handler);
 }, [currentMemberId, subscribePushMutation]);

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
 if (data.currentMemberId && accessCode) {
 if (data.biometricEnabled?.[data.currentMemberId]) {
 setScreen("lock");
 } else {
 setScreen("main");
 }
 }
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
 if (m.biometricEnabled && m.userId) {
 setBiometricEnabled((prev) => ({ ...prev, [m.id]: m.biometricEnabled }));
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
 localStorage.setItem("equilibra_active_tab", activeTab);
 }, [activeTab]);

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

 // First-time tutorial auto-trigger
 useEffect(() => {
 if (screen === "main" && currentMemberId && !isTutorialCompleted(MAIN_TUTORIAL_ID)) {
 const timer = setTimeout(() => setActiveTutorial(MAIN_TUTORIAL_ID), 800);
 return () => clearTimeout(timer);
 }
 }, [screen, currentMemberId]);

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
 const member = members.find((m) => m.id === id);
 if (member?.status === "pending") {
 toast.info("En attente d'approbation");
 return;
 }
 const stored = localStorage.getItem("equilibra_locked_member");
 if (stored && stored !== id) {
 const lockedMember = members.find((m) => m.id === stored);
 if (!lockedMember) { localStorage.removeItem("equilibra_locked_member"); } else { showNotification("Accès verrouillé", `Compte verrouillé sur ${lockedMember.name}`); return; }
 }
 setCurrentMemberId(id);
 // Auto-subscribe to push on identity selection
 if (pushNotifications && vapidPublicKeyQuery.data?.publicKey) {
   subscribeToPush(vapidPublicKeyQuery.data.publicKey, id).then((sub) => {
     if (sub) subscribePushMutation.mutate({ memberId: id, subscription: sub, userAgent: navigator.userAgent });
   });
 }
 if (biometricEnabled[id] && biometricAvailable) {
 setScreen("lock");
 } else {
 setScreen("main");
 }
 }, [members, showNotification, biometricEnabled, biometricAvailable, pushNotifications, vapidPublicKeyQuery.data, subscribePushMutation]);

 const handleBiometricUnlock = useCallback(async () => {
 try {
 const ok = await authenticateBiometric(currentMemberId);
 if (ok) { haptic("success"); setScreen("main"); }
 } catch {
 haptic("error");
 }
 }, [haptic, currentMemberId]);

 const toggleBiometric = useCallback(async () => {
 if (!currentMemberId) return;
 if (biometricEnabled[currentMemberId]) {
 setBiometricEnabled((prev) => ({ ...prev, [currentMemberId]: false }));
 if (!isNetlify) updateMemberBiometricMutation.mutateAsync({ memberId: currentMemberId, enabled: false }).catch(() => {});
 } else {
 try {
 const ok = await registerBiometric(currentMemberId);
 if (ok) {
 setBiometricEnabled((prev) => ({ ...prev, [currentMemberId]: true }));
 haptic("success");
 if (!isNetlify) updateMemberBiometricMutation.mutateAsync({ memberId: currentMemberId, enabled: true }).catch(() => {});
 }
 } catch {}
 }
 }, [currentMemberId, biometricEnabled, haptic, isNetlify, updateMemberBiometricMutation]);

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
 const existingRequest = pendingPayments.find((p) => p.fromId === currentMemberId && p.toId === toId && (p.status === "pending" || p.status === "late") && (!expenseId || p.expenseId === expenseId));
 if (existingRequest) {
 toast.info(`Demande déjà en cours avec ${members.find((m) => m.id === toId)?.name || "cette personne"}. Utilisez Rappeler pour relancer.`);
 return;
 }
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
 }, [currentMemberId, members, haptic, requestPaymentMutation, refetch, showNotification, isNetlify, pendingPayments]);

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
 if (payment) {
 setCompletedPayments((prev) => [...prev, { ...payment, status: "completed" as const, completedAt: Date.now() }]);
 setPendingPayments((prev) => prev.filter((p) => p.id !== id));
 toast.success(`Paiement de ${formatCurrency(payment.amount)} confirmé`);
 }
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
 if (!payment) return;
 const attempts = (payment.attemptCount || 0);
 if (attempts >= 3) {
 toast.info("Nombre maximum de rappels atteint (3/3)");
 return;
 }
 const newAttempts = attempts + 1;
 setPendingPayments((prev) => prev.map((p) => {
 if (p.id !== id) return p;
 if (newAttempts >= 3) return { ...p, status: "late" as const, attemptCount: newAttempts, notificationCount: (p.notificationCount || 0) + 1 };
 return { ...p, notificationCount: (p.notificationCount || 0) + 1, attemptCount: newAttempts };
 }));
 toast.success(`Rappel envoyé à ${payment.toName} (${newAttempts}/3)`);
 if (!isNetlify) {
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
 confirmReceiptMutation.mutateAsync({ paymentId: id, toId: payment.toId, fromId: payment.fromId })
 .then(() => refetch())
 .catch(() => {});
 }
 }, [haptic, pendingPayments, confirmReceiptMutation, refetch, isNetlify]);

 const reportNotReceived = useCallback((id: string, comment?: string) => {
 if (!comment) return;
 haptic("medium");
 const payment = pendingPayments.find((p) => p.id === id);
 setPendingPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: "disputed" as const, disputeNote: comment } : p));
 if (payment) toast.error(`Litige ouvert pour ${formatCurrency(payment.amount)}`);
 if (!isNetlify && payment) {
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

 const cancelPaymentRequest = useCallback((id: string) => {
 haptic("medium");
 const payment = pendingPayments.find((p) => p.id === id);
 setPendingPayments((prev) => prev.filter((p) => p.id !== id));
 if (payment) toast.info(`Demande de ${formatCurrency(payment.amount)} annulée`);
 if (!isNetlify && payment) {
 cancelPaymentRequestMutation.mutateAsync({ paymentId: id })
 .then(() => refetch())
 .catch(() => {});
 }
 }, [haptic, isNetlify, pendingPayments, cancelPaymentRequestMutation, refetch]);

 const handleRegister = useCallback(async (name: string, rawAvatar: string) => {
 const memberId = Date.now().toString();
 const avatar = prepareAvatar(memberId, rawAvatar);
 const newMember: Member = { id: memberId, name, avatar, role: "member", status: "pending" };
 setMembers((prev) => [...prev, newMember]);
 setCurrentMemberId(newMember.id);
 if (!isNetlify && inviteToken) {
 try {
 const r = await joinGroupByInviteMutation.mutateAsync({ token: inviteToken, memberId: newMember.id, memberName: name, memberAvatar: avatar });
 if ((r as any)?.accessPin) {
 localStorage.setItem("equilibra_access", (r as any).accessPin);
 }
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

 const handleAddMemberDirect = useCallback(async (name: string) => {
 if (isNetlify) {
 const memberId = `member_${Date.now()}`;
 const avatar = prepareAvatar(memberId, "👤");
 setMembers((prev) => [...prev, { id: memberId, name, avatar, role: "member", status: "active" }]);
 return { success: true, memberId, accessPin: "" };
 }
 try {
 const result = await addMemberDirectMutation.mutateAsync({ memberId: currentMemberId, name });
 if (result?.success) {
 await refetch();
 return { success: true, memberId: result.memberId, accessPin: result.accessPin || "" };
 }
 return { success: false, error: (result as any)?.error || "Erreur lors de l'ajout" };
 } catch { return { success: false }; }
 }, [isNetlify, addMemberDirectMutation, refetch]);

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

 // ─── Stable Toggle Callbacks (functional updaters = no deps) ───
 const togglePrivacy = useCallback(() => setPrivacyMode(p => !p), []);
 const togglePushNotifications = useCallback(async () => {
   if (!pushNotifications) {
     const granted = await requestPermission();
     if (!granted) return;
     // Subscribe to push
     const vapidKey = vapidPublicKeyQuery.data?.publicKey;
     if (vapidKey && currentMemberId) {
       const sub = await subscribeToPush(vapidKey, currentMemberId);
       if (sub) {
         subscribePushMutation.mutate({
           memberId: currentMemberId,
           subscription: sub,
           userAgent: navigator.userAgent,
         });
       }
     }
   } else {
     // Unsubscribe from push
     const endpoint = await unsubscribeFromPush();
     if (endpoint && currentMemberId) {
       unsubscribePushMutation.mutate({ memberId: currentMemberId, endpoint });
     }
   }
   setPushNotifications(p => !p);
 }, [pushNotifications, requestPermission, currentMemberId, vapidPublicKeyQuery.data, subscribePushMutation, unsubscribePushMutation]);
 const toggleAutoReminders = useCallback(() => setAutoReminders(p => !p), []);
 const toggleOfflineMode = useCallback(() => setOfflineMode(p => !p), []);

 // ─── Stable Navigation Callbacks ───
 const goToMain = useCallback(() => setScreen("main"), []);
 const goToIdentity = useCallback(() => setScreen("identity"), []);
 const goToAccess = useCallback(() => setScreen("access"), []);
 const goToNotifications = useCallback(() => setScreen("notifications"), []);
 const goToReports = useCallback(() => setScreen("reports"), []);
 const goToGroupSettings = useCallback(() => setScreen("groupSettings"), []);
 const goToMembers = useCallback(() => setScreen("members"), []);
 const goToAppearance = useCallback(() => setScreen("appearance"), []);
 const goToEditProfile = useCallback(() => setScreen("editProfile"), []);
 const goToCategories = useCallback(() => setScreen("categoryManagement"), []);

 const handleLogout = useCallback(() => { setCurrentMemberId(""); setScreen("identity"); }, []);

 const handleNotificationSettingsSave = useCallback((s: { pushEnabled?: boolean; reminderFrequency?: string }) => {
 if (s.pushEnabled !== undefined) setPushNotifications(s.pushEnabled);
 if (s.reminderFrequency) { const hours = parseInt(s.reminderFrequency); if (!isNaN(hours)) setReminderDelay(hours); }
 }, []);

 const handleResetAllData = useCallback(async () => {
 try {
 await resetAllDataMutation.mutateAsync();
 setMembers([]); setExpenses([]); setPendingPayments([]); setCompletedPayments([]);
 setScreen("identity");
 toast.success("Toutes les données ont été réinitialisées");
 } catch { toast.error("Erreur lors de la réinitialisation"); }
 }, [resetAllDataMutation]);

 const handleClearData = useCallback(() => {
 Object.keys(localStorage).forEach(k => { if (k.startsWith("equilibra_")) localStorage.removeItem(k); });
 window.location.reload();
 }, []);

 const handleOnBackToMain = useCallback(() => setScreen("main"), []);
 const handleOnBackToAccess = useCallback(() => setScreen("access"), []);

 // ─── Screen Routing ────────────────────────────────────────
 let content: React.ReactNode = null;

 if (screen === "access") {
 content = <AppShell><AccessScreen onSubmit={handleAccessCode} /></AppShell>;
 } else if (screen === "identity") {
 if (members.length === 0) {
 content = <AppShell><RegisterScreen onRegister={(name, rawAvatar) => {
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
 }} onBack={handleOnBackToAccess} groupName="Équilibra" /></AppShell>;
 } else {
 content = <AppShell><IdentityScreen members={members} onSelect={selectIdentity} onReset={handleResetAllData} /></AppShell>;
 }
 } else if (screen === "register") {
 content = <AppShell><RegisterScreen onRegister={handleRegister} onBack={handleOnBackToAccess} /></AppShell>;
 } else if (screen === "invite") {
 content = <AppShell><InviteScreen inviteToken={inviteToken!} onJoinByInvite={async (name, rawAvatar) => {
 const memberId = Date.now().toString();
 const avatar = prepareAvatar(memberId, rawAvatar);
 try {
 const r = await joinGroupByInviteMutation.mutateAsync({ token: inviteToken!, memberId, memberName: name, memberAvatar: avatar });
 if (r?.success) {
 if ((r as any).accessPin) {
 localStorage.setItem("equilibra_access", (r as any).accessPin);
 }
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
 }} onBack={handleOnBackToAccess} /></AppShell>;
 } else if (screen === "lock" && currentMember) {
 content = <AppShell><LockScreen member={currentMember} onUnlock={handleBiometricUnlock} onSkip={goToMain} onSwitchIdentity={goToIdentity} /></AppShell>;
 } else if (screen === "notifications") {
 content = <AppShell><ErrorBoundary><NotificationsScreen notifications={notifications} currentMemberId={currentMemberId} onBack={goToMain} onMarkRead={(id) => markNotificationReadMutation.mutate({ notificationId: id })} onMarkAllRead={() => markAllNotificationsReadMutation.mutate({ memberId: currentMemberId })} /></ErrorBoundary></AppShell>;
 } else if (screen === "notificationSettings") {
 content = <AppShell><ErrorBoundary><NotificationSettingsScreen settings={{ pushEnabled: pushNotifications, emailEnabled: false, reminderFrequency: reminderDelay.toString() + "h" }} onBack={goToMain} onSave={handleNotificationSettingsSave} /></ErrorBoundary></AppShell>;
 } else if (screen === "groupSettings" || screen === "settings") {
 content = <AppShell><ErrorBoundary><Suspense fallback={<TabContentSkeleton />}><SettingsScreen monthlyBudget={monthlyBudget} onSetBudget={updateBudget} currency={currency} onSetCurrency={updateCurrency} autoReminders={autoReminders} onToggleReminders={toggleAutoReminders} privacyMode={privacyMode} onTogglePrivacy={togglePrivacy} offlineMode={offlineMode} onToggleOffline={toggleOfflineMode} pushNotifications={pushNotifications} onTogglePushNotifications={togglePushNotifications} reminderDelay={reminderDelay} onSetReminderDelay={(d: number) => setReminderDelay(d)} onClearData={handleClearData} biometricEnabled={!!biometricEnabled[currentMemberId]} onToggleBiometric={toggleBiometric} onBack={goToMain} /></Suspense></ErrorBoundary></AppShell>;
 } else if (screen === "members") {
 content = <AppShell><ErrorBoundary><Suspense fallback={<TabContentSkeleton />}><MemberManagement members={members} currentMemberId={currentMemberId} expenses={expenses} pendingRequests={pendingMembers.map(m => ({ id: `pending_${m.id}`, memberId: m.id, memberName: m.name, memberAvatar: m.avatar, requestedAt: 0 }))} onChangeRole={(id, role) => { setMembers((prev) => prev.map((m) => m.id === id ? { ...m, role } : m)); changeMemberRoleMutation.mutate({ memberId: id, role: role as "admin" | "member" }); }} onRemoveMember={removeMember} onAddMember={() => addMember("Nouveau", "👤")} onAddMemberDirect={handleAddMemberDirect} onApproveMember={approveMember} onRefuseMember={refuseMemberCb} onBack={goToMain} onUpdateGroupSettings={(settings) => { updateGroupSettingsMutation.mutate(settings); toast.success("Paramètres mis à jour"); }} onResetAllData={handleResetAllData} groupName="Équilibra Groupe" groupRequireApproval={requireApproval} /></Suspense></ErrorBoundary></AppShell>;
 } else if (screen === "appearance") {
 content = <AppShell><ErrorBoundary><Suspense fallback={<TabContentSkeleton />}><AppearanceScreen onBack={goToMain} /></Suspense></ErrorBoundary></AppShell>;
 } else if (screen === "editProfile" && currentMember) {
 content = <AppShell><ErrorBoundary><Suspense fallback={<TabContentSkeleton />}><EditProfileScreen currentName={currentMember.name} currentAvatar={currentMember.avatar} onSave={handleUpdateProfile} onBack={goToMain} saving={profileSaving} /></Suspense></ErrorBoundary></AppShell>;
 } else if (screen === "reports") {
 content = <AppShell><ErrorBoundary><Suspense fallback={<TabContentSkeleton />}><ReportsScreen expenses={expenses} members={members} pendingPayments={pendingPayments} completedPayments={completedPayments} monthlyBudget={monthlyBudget} onBack={goToMain} /></Suspense></ErrorBoundary></AppShell>;
 } else if (screen === "categoryManagement") {
 content = <AppShell><ErrorBoundary><Suspense fallback={<TabContentSkeleton />}><CategoryManagementScreen currentMemberId={currentMemberId} onBack={goToMain} /></Suspense></ErrorBoundary></AppShell>;
 } else if (!currentMember) {
 content = <AppShell><div className="flex items-center justify-center h-screen"><p className="text-muted-foreground">Chargement...</p></div></AppShell>;
 } else {
 // ─── Main View ─────────────────────────────────────────────
 if (serverWaking && !groupData) {
 content = (
 <AppShell>
 <div className="flex flex-col items-center justify-center h-[80dvh] px-8 text-center">
 <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
 <svg className="w-8 h-8 text-primary animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
 <path d="M5 12.55a11 11 0 0 1 14.08 0" />
 <path d="M1.42 9a16 16 0 0 1 21.16 0" />
 <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
 <circle cx="12" cy="20" r="1" />
 </svg>
 </div>
 <h2 className="text-lg font-bold mb-2">Connexion au serveur...</h2>
 <p className="text-sm text-muted-foreground mb-1">
 {serverWakeRetries < 2 
 ? "Le serveur se connecte, patientez un instant."
 : "Le serveur demarre, cela peut prendre quelques secondes."}
 </p>
 <p className="text-xs text-muted-foreground/50 mt-4">
 Tentative {serverWakeRetries + 1}/3
 </p>
 <button
 onClick={() => { setServerWakeRetries(prev => prev + 1); refetch(); }}
 className="mt-6 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
 >
 Reessayer
 </button>
 </div>
 </AppShell>
 );
 } else {
 const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
 const myBalance = balances[currentMemberId] || 0;

 content = (
 <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
 <div className="min-h-screen pb-24 scrollbar-hidden overflow-y-auto">
 {activeTab === "home" && <HomeTab key="home" currentMember={currentMember} balance={myBalance} totalSpent={totalSpent} expenseCount={expenses.length} recentExpenses={recentExpenses} members={members} pendingPayments={myPendingPayments} completedPayments={myCompletedPayments} onConfirmPayment={confirmPayment} onRefusePayment={refusePayment} onResentPayment={resentPayment} onConfirmReceipt={confirmReceipt} onReportNotReceived={reportNotReceived} onMarkAsPaid={markAsPaid} onCancelPaymentRequest={cancelPaymentRequest} expenses={expenses} monthlyBudget={monthlyBudget} currency={currency} onUpdateBudget={updateBudget} />}
 {activeTab === "expenses" && <ExpensesTab key="expenses" expenses={expenses} members={members} currentMemberId={currentMemberId} onDelete={deleteExpense} onAdd={() => { setDuplicateFrom(null); setShowAddExpense(true); }} onDuplicate={(exp) => { setDuplicateFrom(exp); setShowAddExpense(true); }} onRequestPayment={requestPayment} onRequestGroupPayment={requestGroupPayment} currency={currency} pendingPayments={pendingPayments} completedPayments={completedPayments} categories={getCategoriesQuery.data?.categories || []} />}
 {activeTab === "balances" && <BalancesTab key="balances" members={members} balances={balances} suggestedTransactions={suggestedTransactions} currentMemberId={currentMemberId} onRequestPayment={(toId: string, amount: number, note?: string) => requestPayment(toId, amount, undefined, note)} expenses={expenses} currency={currency} />}
 {activeTab === "history" && <Suspense key="history" fallback={<TabContentSkeleton />}><PaymentHistory payments={[...completedPayments, ...pendingPayments].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))} expenses={expenses} members={members} currentMemberId={currentMemberId} currency={currency} onConfirmPayment={confirmPayment} onRefusePayment={refusePayment} onResentPayment={resentPayment} onConfirmReceipt={confirmReceipt} onReportNotReceived={reportNotReceived} onMarkAsPaid={markAsPaid} onCancelPayment={cancelPaymentRequest} /></Suspense>}
 {activeTab === "stats" && <ErrorBoundary><StatsTab key="stats" expenses={expenses} members={members} currentMemberId={currentMemberId} pendingPayments={pendingPayments} completedPayments={completedPayments} monthlyBudget={monthlyBudget} currency={currency} categories={getCategoriesQuery.data?.categories || []} /></ErrorBoundary>}
 {activeTab === "profile" && <ProfileTab key="profile" currentMember={currentMember} members={members} biometricEnabled={!!biometricEnabled[currentMemberId]} biometricAvailable={biometricAvailable} onToggleBiometric={toggleBiometric} onLogout={handleLogout} onRemoveMember={removeMember} isLocked={!!localStorage.getItem("equilibra_locked_member")} unreadCount={unreadCount} onOpenNotifications={goToNotifications} onOpenReports={goToReports} onOpenGroupSettings={goToGroupSettings} onOpenMembers={goToMembers} onOpenAppearance={goToAppearance} onOpenEditProfile={goToEditProfile} onOpenCategories={goToCategories} onResetAllData={handleResetAllData} onLeaveGroup={leaveGroup} currency={currency} onSetCurrency={updateCurrency} monthlyBudget={monthlyBudget} onSetBudget={updateBudget} pushNotifications={pushNotifications} onTogglePushNotifications={togglePushNotifications} autoReminders={autoReminders} onToggleReminders={toggleAutoReminders} reminderDelay={reminderDelay} onSetReminderDelay={(d: number) => setReminderDelay(d)} privacyMode={privacyMode} onTogglePrivacy={togglePrivacy} onReplayTutorial={(id) => setActiveTutorial(id)} />}

 {/* Floating Add Button */}
 {activeTab === "expenses" && (
 <button data-tutorial="add-expense-btn" onClick={() => setShowAddExpense(true)} className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
 <Plus size={24} />
 </button>
 )}

 {showAddExpense && <ErrorBoundary><AddExpenseSheet members={members} currentMemberId={currentMemberId} onAdd={(e) => { addExpense(e); setShowAddExpense(false); setDuplicateFrom(null); }} onClose={() => { setShowAddExpense(false); setDuplicateFrom(null); }} currency={currency} categories={getCategoriesQuery.data?.categories || []} duplicateFrom={duplicateFrom} allExpenses={expenses} /></ErrorBoundary>}
 </div>
 </AppShell>
 );
 }
 }

 return (
 <>
 {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
 {!showSplash && showOnboarding && <OnboardingScreen onComplete={() => setShowOnboarding(false)} />}
 {!showSplash && !showOnboarding && (
 <ThemeProvider memberId={currentMemberId}>
 <ThemeToaster />
 {content}
 </ThemeProvider>
 )}
 {activeTutorial && ALL_TUTORIALS[activeTutorial as keyof typeof ALL_TUTORIALS] && (
 <GuidedTour
 tutorialId={activeTutorial as any}
 steps={ALL_TUTORIALS[activeTutorial as keyof typeof ALL_TUTORIALS].steps}
 isOpen={true}
 onClose={() => setActiveTutorial(null)}
 isAdmin={currentMember?.role === "admin"}
 currentTab={activeTab}
 onTabChange={(tab) => setActiveTab(tab as Tab)}
 />
 )}
 </>
 );
}
