import { useState, useEffect, useMemo, useCallback } from "react";
import { Toaster, toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { trpc } from "@/lib/trpc";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";
import {
  Home,
  Receipt,
  Scale,
  BarChart3,
  User,
  Plus,
  X,
  Trash2,
  Camera,
  Fingerprint,
  Shield,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  Copy,
  Share2,
  QrCode,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Moon,
  Sun,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Member {
  id: string;
  name: string;
  avatar: string;
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
  photoUrl?: string;
}

interface PendingPayment {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
  status: "pending" | "accepted" | "refused" | "completed";
  response?: "accepted" | "refused";
  expenseId?: string; // Link to specific expense
  createdAt: number;
  respondedAt?: number;
  confirmedBy?: string; // Who confirmed the payment
  notificationSent: boolean; // Track if notification was sent
  notificationCount: number; // Count of reminders sent
}

type Screen = "identity" | "lock" | "main" | "register" | "access";
type Tab = "home" | "expenses" | "balances" | "stats" | "profile";

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: "Nourriture", emoji: "🍕" },
  { name: "Transport", emoji: "🚗" },
  { name: "Loisirs", emoji: "🎬" },
  { name: "Logement", emoji: "🏠" },
  { name: "Courses", emoji: "🛒" },
  { name: "Santé", emoji: "💊" },
  { name: "Shopping", emoji: "🛍️" },
  { name: "Apéro", emoji: "🥂" },
  { name: "Cigarettes", emoji: "🚬" },
  { name: "420", emoji: "🌿" },
  { name: "Autre", emoji: "📦" },
];

const DEFAULT_MEMBERS: Member[] = [
  { id: "admin", name: "Mohamed", avatar: "👨‍💼" },
  { id: "2", name: "Amine", avatar: "👨" },
  { id: "3", name: "Isma", avatar: "👨‍🦱" },
  { id: "4", name: "Rachid", avatar: "👨‍🦲" },
  { id: "5", name: "Yasmina", avatar: "👩" },
];

const STORAGE_KEY = "equilibra_data";

const CHART_COLORS = ["#34d399", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa", "#fb923c", "#2dd4bf", "#e879f9"];

// ─── Spring animation config ──────────────────────────────────────────────────
const spring = { type: "spring" as const, stiffness: 300, damping: 30 };
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
};

// ─── Haptic Feedback Hook ───────────────────────────────────────────────────────
function useHaptic() {
  const trigger = useCallback((type: "light" | "medium" | "heavy" | "success" | "error" | "selection") => {
    if (!navigator.vibrate) return;
    
    switch (type) {
      case "light":
        navigator.vibrate(10);
        break;
      case "medium":
        navigator.vibrate(20);
        break;
      case "heavy":
        navigator.vibrate(40);
        break;
      case "success":
        navigator.vibrate([10, 50, 10]);
        break;
      case "error":
        navigator.vibrate([30, 50, 30, 50, 30]);
        break;
      case "selection":
        navigator.vibrate(5);
        break;
    }
  }, []);

  return trigger;
}

// ─── Utility Functions ────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(timestamp));
}

function simplifyDebts(balances: Record<string, number>): Array<{ from: string; to: string; amount: number; explanation: string }> {
  const debtors: Array<{ id: string; amount: number }> = [];
  const creditors: Array<{ id: string; amount: number }> = [];

  Object.entries(balances).forEach(([id, balance]) => {
    if (balance < -0.01) debtors.push({ id, amount: -balance });
    else if (balance > 0.01) creditors.push({ id, amount: balance });
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions: Array<{ from: string; to: string; amount: number; explanation: string }> = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > 0.01) {
      transactions.push({ 
        from: debtors[i].id, 
        to: creditors[j].id, 
        amount,
        explanation: `Pour équilibrer les comptes`
      });
    }
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return transactions;
}

// Calculate detailed breakdown for each member
function calculateMemberBreakdown(
  memberId: string,
  expenses: Expense[],
  members: Member[]
): {
  totalPaid: number;
  totalShare: number;
  balance: number;
  owesTo: Array<{ to: string; amount: number; reason: string }>;
  owedBy: Array<{ from: string; amount: number; reason: string }>;
} {
  let totalPaid = 0;
  let totalShare = 0;
  const owesTo: Array<{ to: string; amount: number; reason: string }> = [];
  const owedBy: Array<{ from: string; amount: number; reason: string }> = [];

  expenses.forEach((exp) => {
    // Calculate what this member should pay
    const memberShare = exp.participants.includes(memberId) ? exp.amount / exp.participants.length : 0;
    totalShare += memberShare;

    // Calculate what this member actually paid
    if (exp.payerId === memberId) {
      totalPaid += exp.amount;
    }

    // Track individual debts
    if (exp.payerId !== memberId && exp.participants.includes(memberId)) {
      const payer = members.find((m) => m.id === exp.payerId);
      const amount = exp.amount / exp.participants.length;
      owesTo.push({
        to: exp.payerId,
        amount,
        reason: `${exp.description} (${formatDate(exp.date)})`
      });
    }

    // Track what others owe this member
    if (exp.payerId === memberId) {
      exp.participants.forEach((participantId) => {
        if (participantId !== memberId) {
          const participant = members.find((m) => m.id === participantId);
          const amount = exp.amount / exp.participants.length;
          owedBy.push({
            from: participantId,
            amount,
            reason: `${exp.description} (${formatDate(exp.date)})`
          });
        }
      });
    }
  });

  const balance = totalPaid - totalShare;

  return {
    totalPaid,
    totalShare,
    balance,
    owesTo,
    owedBy
  };
}

// ─── WebAuthn Helpers ─────────────────────────────────────────────────────────
async function checkBiometricAvailable(): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) return false;
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

async function registerBiometric(memberId: string): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) return false;

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = new TextEncoder().encode(memberId);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "Équilibra Groupe", id: window.location.hostname },
        user: {
          id: userId,
          name: `member-${memberId}`,
          displayName: `Membre ${memberId}`,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },
          { alg: -257, type: "public-key" },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
      },
    });

    if (credential) {
      const credId = btoa(String.fromCharCode(...Array.from(new Uint8Array((credential as PublicKeyCredential).rawId))));
      localStorage.setItem(`equilibra_cred_${memberId}`, credId);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function authenticateBiometric(memberId: string): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) return false;

    const credIdStr = localStorage.getItem(`equilibra_cred_${memberId}`);
    if (!credIdStr) return false;

    const credId = Uint8Array.from(atob(credIdStr), (c) => c.charCodeAt(0));
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [{ id: credId, type: "public-key" }],
        userVerification: "required",
        timeout: 60000,
      },
    });

    return !!assertion;
  } catch {
    return false;
  }
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  // Check if running on Netlify (no backend)
  // Detect environment
  const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isNetlify = window.location.hostname.includes('netlify.app');

  // Development-only logging
  const devLog: (...args: any[]) => void = isDevelopment ? console.log : () => {};

  // tRPC queries and mutations - enabled in production, disabled on Netlify
  const utils = trpc.useUtils();
  const { data: groupData, isLoading, refetch } = trpc.equilibra.getGroupData.useQuery(undefined, {
    enabled: !isNetlify, // Disable on Netlify, enable in production
    refetchInterval: isNetlify ? false : 10000, // Auto-refresh every 10 seconds in production
    retry: 2,
    refetchOnWindowFocus: true,
  });
  const initGroup = trpc.equilibra.initGroup.useMutation();
  const addExpenseMutation = trpc.equilibra.addExpense.useMutation();
  const deleteExpenseMutation = trpc.equilibra.deleteExpense.useMutation();
  const requestPaymentMutation = trpc.equilibra.requestPayment.useMutation();
  const confirmPaymentMutation = trpc.equilibra.confirmPayment.useMutation();
  const refusePaymentMutation = trpc.equilibra.refusePayment.useMutation();
  const updateBiometricMutation = trpc.equilibra.updateMemberBiometric.useMutation();

  // State
  const [screen, setScreen] = useState<Screen>("identity");
  const [accessCode, setAccessCode] = useState<string>(() => localStorage.getItem('aperosplit_access') || "");
  const [members, setMembers] = useState<Member[]>(DEFAULT_MEMBERS);
  const [currentMemberId, setCurrentMemberId] = useState<string>("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [completedPayments, setCompletedPayments] = useState<PendingPayment[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState<Record<string, boolean>>({});
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [monthlyBudget, setMonthlyBudget] = useState<number>(1000);

  // Check biometric availability
  useEffect(() => {
    checkBiometricAvailable().then(setBiometricAvailable);
  }, []);

  // Real-time sync for mobile app
  useRealtimeSync({
    enabled: screen === "main" && !isNetlify,
    onDataChange: () => {
      // Show subtle notification when data changes
      if (screen === "main") {
        refetch();
      }
    },
  });

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as "light" | "dark" | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  // Load budget from localStorage
  useEffect(() => {
    const savedBudget = localStorage.getItem('equilibra_monthly_budget');
    if (savedBudget) {
      setMonthlyBudget(parseFloat(savedBudget));
    }
  }, []);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      return newTheme;
    });
  }, []);

  // Update monthly budget
  const updateBudget = useCallback((newBudget: number) => {
    setMonthlyBudget(newBudget);
    localStorage.setItem('equilibra_monthly_budget', newBudget.toString());
  }, []);

  // Handle access code submission
  const handleAccessCode = useCallback((code: string) => {
    if (code.trim()) {
      setAccessCode(code.trim());
      localStorage.setItem('aperosplit_access', code.trim());
      setScreen('identity');
    }
  }, []);

  // Check for invite parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteParam = urlParams.get('invite');
    
    if (inviteParam === 'true') {
      // User is joining via QR code - show registration screen
      setScreen('register');
      // Store that this is an invited user
      localStorage.setItem('equilibra_invited', 'true');
    }
    
    // Check if access code is required
    if (!accessCode) {
      setScreen('access');
    }
  }, [accessCode]);

  // Lock user to their account if invited
  useEffect(() => {
    const isInvited = localStorage.getItem('equilibra_invited');
    if (isInvited === 'true' && currentMemberId && currentMemberId !== 'admin') {
      // Store the locked member ID
      localStorage.setItem('equilibra_locked_member', currentMemberId);
    }
  }, [currentMemberId]);

  // Initialize group on backend
  useEffect(() => {
    const initializeBackend = async () => {
      if (isNetlify) {
        devLog("Running on Netlify - skipping backend initialization");
        return;
      }
      try {
        await initGroup.mutateAsync({ members: DEFAULT_MEMBERS });
      } catch (error) {
        devLog("Backend initialization failed, using local storage");
      }
    };
    initializeBackend();
  }, [isNetlify]);

  // Sync with backend data when available
  useEffect(() => {
    if (isNetlify) return;
    if (groupData && !isLoading) {
      if (groupData.members?.length > 0) {
        setMembers(groupData.members);
      }
      if (groupData.expenses?.length > 0) {
        // Transform backend expenses to frontend format
        const transformedExpenses: Expense[] = groupData.expenses.map((e) => ({
          id: e.id,
          description: e.description,
          amount: e.amount,
          payerId: e.payerId,
          category: e.category,
          categoryEmoji: CATEGORIES.find((c) => c.name === e.category)?.emoji || "📦",
          date: new Date(e.date).getTime(),
          participants: e.participants,
          photoUrl: e.photoUrl || undefined,
        }));
        setExpenses(transformedExpenses);
      }
      if (groupData.pending?.length > 0) {
        // Transform backend pending payments to frontend format
        const transformedPending: PendingPayment[] = groupData.pending.map((p) => ({
          id: p.id,
          fromId: p.fromId,
          fromName: p.fromName || members.find(m => m.id === p.fromId)?.name || "Inconnu",
          toId: p.toId,
          toName: p.toName || members.find(m => m.id === p.toId)?.name || "Inconnu",
          amount: p.amount,
          status: (p.status === "confirmed" ? "completed" : p.status) as "pending" | "accepted" | "refused" | "completed",
          response: (p.status === "confirmed" ? "accepted" : undefined) as "accepted" | "refused" | undefined,
          expenseId: (p as any).expenseId,
          createdAt: p.createdAt ? new Date(p.createdAt).getTime() : new Date((p as any).date || Date.now()).getTime(),
          respondedAt: (p as any).respondedAt ? new Date((p as any).respondedAt).getTime() : undefined,
          confirmedBy: (p as any).confirmedBy,
          notificationSent: (p as any).notificationSent || false,
          notificationCount: (p as any).notificationCount || 0,
        }));
        setPendingPayments(transformedPending);
      }
    }
  }, [groupData, isLoading]);

  // Load data from localStorage (fallback) - Run only once on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const lockedMemberId = localStorage.getItem('equilibra_locked_member');
      const completedPayments = localStorage.getItem('equilibra_completed_payments');
      
      if (saved) {
        const data = JSON.parse(saved);
        // Force update members if they don't match DEFAULT_MEMBERS
        if (!data.members || data.members.length !== DEFAULT_MEMBERS.length || 
            data.members[0].name !== DEFAULT_MEMBERS[0].name) {
          setMembers(DEFAULT_MEMBERS);
        } else if (!groupData?.members) {
          setMembers(data.members);
        }
        if (data.expenses && !groupData?.expenses) setExpenses(data.expenses);
        if (data.pendingPayments && !groupData?.pending) setPendingPayments(data.pendingPayments);
        if (data.biometricEnabled) setBiometricEnabled(data.biometricEnabled);
        
        // If member is locked (via QR scan), force that member
        if (lockedMemberId) {
          const lockedMember = DEFAULT_MEMBERS.find(m => m.id === lockedMemberId);
          if (lockedMember) {
            setCurrentMemberId(lockedMemberId);
            setScreen("main");
            return;
          }
        }
        
        if (data.currentMemberId) {
          setCurrentMemberId(data.currentMemberId);
          setScreen("main"); // Always go to main screen on load, not lock screen
        }
      }
      
      // Load completed payments history
      if (completedPayments) {
        setCompletedPayments(JSON.parse(completedPayments));
      }
    } catch { /* ignore */ }
  }, []); // Empty dependency array - run only once

  // Save data to localStorage (fallback)
  useEffect(() => {
    const data = { members, expenses, pendingPayments, biometricEnabled, currentMemberId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [members, expenses, pendingPayments, biometricEnabled, currentMemberId]);

  // Save completed payments to localStorage
  useEffect(() => {
    localStorage.setItem('equilibra_completed_payments', JSON.stringify(completedPayments));
  }, [completedPayments]);

  // Polling sync - DISABLED on Netlify (no backend available)
  // On Netlify, each device has its own localStorage - no cross-device sync
  useEffect(() => {
    if (isNetlify) return; // No backend = no polling needed
    
    const interval = setInterval(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          if (data.expenses && JSON.stringify(data.expenses) !== JSON.stringify(expenses)) {
            setExpenses(data.expenses);
          }
          if (data.pendingPayments && JSON.stringify(data.pendingPayments) !== JSON.stringify(pendingPayments)) {
            setPendingPayments(data.pendingPayments);
          }
          if (data.members && JSON.stringify(data.members) !== JSON.stringify(members)) {
            setMembers(data.members);
          }
        }
      } catch { /* ignore */ }
    }, 5000); // Slower polling to reduce flickering
    return () => clearInterval(interval);
  }, [expenses, pendingPayments, members, isNetlify]);

  // Computed values
  const currentMember = useMemo(() => members.find((m) => m.id === currentMemberId), [members, currentMemberId]);

  const balances = useMemo(() => {
    const b: Record<string, number> = {};
    members.forEach((m) => (b[m.id] = 0));
    expenses.forEach((exp) => {
      const perPerson = exp.amount / exp.participants.length;
      exp.participants.forEach((pid) => { b[pid] = (b[pid] || 0) - perPerson; });
      b[exp.payerId] = (b[exp.payerId] || 0) + exp.amount;
    });
    return b;
  }, [members, expenses]);

  const suggestedTransactions = useMemo(() => simplifyDebts(balances), [balances]);

  // Handle switch to another account - DISABLED biometric to prevent issues
  const handleSwitchAccount = useCallback(async (targetMemberId: string) => {
    setCurrentMemberId(targetMemberId);
    setScreen("main");
  }, []);

  // Handlers
  const selectIdentity = useCallback(async (memberId: string) => {
    // Check if user is locked to a specific account (invited via QR code)
    const lockedMemberId = localStorage.getItem('equilibra_locked_member');
    if (lockedMemberId && memberId !== lockedMemberId) {
      toast.error("Vous ne pouvez accéder qu'à votre propre compte");
      return;
    }
    
    // Use handleSwitchAccount for biometric authentication
    await handleSwitchAccount(memberId);
  }, [handleSwitchAccount]);

  // Handle app resume - DISABLED to prevent lock screen loops
  // useEffect(() => {
  //   const handleVisibilityChange = () => {
  //     if (document.visibilityState === 'visible' && currentMemberId && biometricEnabled[currentMemberId]) {
  //       // Only require auth if we were in main screen (not already in lock screen)
  //       if (screen === "main") {
  //         setScreen("lock");
  //       }
  //     }
  //   };

  //   document.addEventListener('visibilitychange', handleVisibilityChange);
  //   return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  // }, [currentMemberId, biometricEnabled, screen]);

  // Handle profile tab access - DISABLED biometric to prevent issues
  const handleProfileAccess = useCallback(async () => {
    setActiveTab("profile");
  }, []);

  // Handle logout - DISABLED biometric to prevent issues
  const handleLogout = useCallback(async () => {
    setScreen("identity");
  }, []);

  const handleBiometricUnlock = useCallback(async () => {
    const success = await authenticateBiometric(currentMemberId);
    if (success) {
      setScreen("main");
      toast.success("Déverrouillé avec succès");
    } else {
      toast.error("Authentification échouée. Réessayez.");
    }
  }, [currentMemberId]);

  const haptic = useHaptic();

  const toggleBiometric = useCallback(async () => {
    haptic("medium");
    if (!biometricAvailable) {
      toast.error("La biométrie n'est pas disponible sur cet appareil");
      haptic("error");
      return;
    }
    if (biometricEnabled[currentMemberId]) {
      setBiometricEnabled((prev) => ({ ...prev, [currentMemberId]: false }));
      localStorage.removeItem(`equilibra_cred_${currentMemberId}`);
      
      // Update backend
      if (!isNetlify) {
        try {
          await updateBiometricMutation.mutateAsync({
            memberId: currentMemberId,
            enabled: false,
          });
        } catch (error) {
          devLog("Backend biometric update failed");
        }
      }
      
      toast.success("Biométrie désactivée");
      haptic("success");
    } else {
      const success = await registerBiometric(currentMemberId);
      if (success) {
        setBiometricEnabled((prev) => ({ ...prev, [currentMemberId]: true }));
        
        // Update backend
        if (!isNetlify) {
          try {
            await updateBiometricMutation.mutateAsync({
              memberId: currentMemberId,
              credentialId: localStorage.getItem(`equilibra_cred_${currentMemberId}`) || "",
              enabled: true,
            });
          } catch (error) {
            devLog("Backend biometric update failed");
          }
        }
        
        toast.success("Face ID / Touch ID activé !");
        haptic("success");
      } else {
        toast.error("Impossible d'activer la biométrie");
        haptic("error");
      }
    }
  }, [currentMemberId, biometricEnabled, biometricAvailable, haptic, updateBiometricMutation, isNetlify]);

  // Add new member
  const addMember = useCallback(async (name: string, avatar: string) => {
    const newMember: Member = {
      id: `member_${Date.now()}`,
      name,
      avatar,
    };
    
    setMembers((prev) => [...prev, newMember]);
    toast.success(`${name} a rejoint le groupe`);
    
    // Update backend
    if (!isNetlify) {
      try {
        await initGroup.mutateAsync({ members: [...members, newMember] });
        refetch();
      } catch (error) {
        devLog("Backend member add failed");
      }
    }
  }, [members, initGroup, refetch, isNetlify]);

  // Handle registration via QR code
  const handleRegister = useCallback(async (name: string, avatar: string) => {
    const newMember: Member = {
      id: `member_${Date.now()}`,
      name,
      avatar,
    };
    
    setMembers((prev) => [...prev, newMember]);
    setCurrentMemberId(newMember.id);
    setScreen("main");
    localStorage.setItem('equilibra_locked_member', newMember.id);
    toast.success(`Bienvenue ${name} !`);
    
    // Update backend
    if (!isNetlify) {
      try {
        await initGroup.mutateAsync({ members: [...members, newMember] });
        refetch();
      } catch (error) {
        devLog("Backend member add failed");
      }
    }
  }, [members, initGroup, refetch, isNetlify]);

  // Remove member
  const removeMember = useCallback(async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    
    // Check if member has any expenses
    const hasExpenses = expenses.some((e) => e.payerId === memberId || e.participants.includes(memberId));
    if (hasExpenses) {
      toast.error("Impossible de supprimer un membre avec des dépenses");
      return;
    }
    
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    toast.success(`${member.name} a quitté le groupe`);
    
    // Update backend
    if (!isNetlify) {
      try {
        await initGroup.mutateAsync({ members: members.filter((m) => m.id !== memberId) });
        refetch();
      } catch (error) {
        devLog("Backend member remove failed");
      }
    }
  }, [members, expenses, initGroup, refetch, isNetlify]);

  const addExpense = useCallback(async (expense: Omit<Expense, "id" | "date">) => {
    haptic("success");
    
    // Try to add via backend first
    if (!isNetlify) {
      try {
        const result = await addExpenseMutation.mutateAsync({
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          payerId: expense.payerId,
          participants: expense.participants,
          photoUrl: expense.photoUrl,
        });
        
        if (result.success) {
          // Optimistic update
          const newExp: Expense = { 
            ...expense, 
            id: result.expenseId || `exp_${Date.now()}`, 
            date: Date.now(),
            categoryEmoji: expense.categoryEmoji
          };
          setExpenses((prev) => [...prev, newExp]);
          toast.success("Dépense ajoutée");
          refetch(); // Refresh from backend
          return;
        }
      } catch (error) {
        devLog("Backend add failed, using local storage");
      }
    }
    // Fallback to local storage
    const newExp: Expense = { 
      ...expense, 
      id: `exp_${Date.now()}`, 
      date: Date.now(),
      categoryEmoji: expense.categoryEmoji
    };
    setExpenses((prev) => [...prev, newExp]);
    toast.success("Dépense ajoutée (local)");
  }, [haptic, addExpenseMutation, refetch, isNetlify]);

  const deleteExpense = useCallback(async (id: string) => {
    haptic("heavy");
    const exp = expenses.find((e) => e.id === id);
    if (exp && exp.payerId === currentMemberId) {
      if (!isNetlify) {
        try {
          await deleteExpenseMutation.mutateAsync({
            expenseId: id,
            description: exp.description,
            amount: exp.amount,
            authorId: currentMemberId,
          });
          setExpenses((prev) => prev.filter((e) => e.id !== id));
          toast.success("Dépense supprimée");
          refetch();
          return;
        } catch (error) {
          devLog("Backend delete failed, using local storage");
        }
      }
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success("Dépense supprimée (local)");
    } else {
      haptic("error");
      toast.error("Seul le payeur peut supprimer cette dépense");
    }
  }, [expenses, currentMemberId, haptic, deleteExpenseMutation, refetch, isNetlify]);

  const requestPayment = useCallback(async (toId: string, amount: number, expenseId?: string) => {
    haptic("medium");
    const fromMember = members.find((m) => m.id === currentMemberId);
    const toMember = members.find((m) => m.id === toId);
    
    if (!fromMember || !toMember) return;
    
    // Check for duplicate payment request (same from, to, amount, and optionally expense)
    const existingPayment = pendingPayments.find(p => 
      p.fromId === currentMemberId && 
      p.toId === toId && 
      p.amount === amount &&
      p.status === "pending" &&
      (expenseId ? p.expenseId === expenseId : true)
    );
    
    if (existingPayment) {
      // Duplicate found - just send notification reminder
      if (!isNetlify) {
        try {
          await requestPaymentMutation.mutateAsync({
            fromId: currentMemberId,
            fromName: fromMember.name,
            toId,
            toName: toMember.name,
            amount,
          });
        } catch (error) {
          devLog("Backend notification failed, using local");
        }
      }
      
      // Increment notification count locally
      setPendingPayments(prev => prev.map(p => 
        p.id === existingPayment.id 
          ? { ...p, notificationCount: (p.notificationCount || 0) + 1, notificationSent: true }
          : p
      ));
      
      toast.success("Rappel envoyé à " + toMember.name);
      return;
    }
    
    // No duplicate - create new payment request
    if (!isNetlify) {
      try {
        const result = await requestPaymentMutation.mutateAsync({
          fromId: currentMemberId,
          fromName: fromMember.name,
          toId,
          toName: toMember.name,
          amount,
        });
        
        if (result.success) {
          const payment: PendingPayment = {
            id: result.paymentId || `pay_${Date.now()}`,
            fromId: currentMemberId,
            fromName: fromMember.name,
            toId,
            toName: toMember.name,
            amount,
            status: "pending",
            expenseId,
            createdAt: Date.now(),
            notificationSent: true,
            notificationCount: 1,
          };
          setPendingPayments((prev) => [...prev, payment]);
          toast.success("Demande de remboursement envoyée à " + toMember.name);
          refetch();
          return;
        }
      } catch (error) {
        devLog("Backend request failed, using local storage");
      }
    }
    
    const payment: PendingPayment = {
      id: `pay_${Date.now()}`,
      fromId: currentMemberId,
      fromName: fromMember.name,
      toId,
      toName: toMember.name,
      amount,
      status: "pending",
      expenseId,
      createdAt: Date.now(),
      notificationSent: true,
      notificationCount: 1,
    };
    setPendingPayments((prev) => [...prev, payment]);
    toast.success("Demande de remboursement envoyée (local)");
  }, [currentMemberId, members, haptic, requestPaymentMutation, refetch, isNetlify, pendingPayments]);

  const confirmPayment = useCallback(async (paymentId: string) => {
    haptic("success");
    const payment = pendingPayments.find((p) => p.id === paymentId);
    if (!payment) return;
    
    // If current user is the one who owes money (fromId), they are accepting to pay
    if (payment.fromId === currentMemberId) {
      if (!isNetlify) {
        try {
          await confirmPaymentMutation.mutateAsync({
            paymentId,
            fromId: payment.fromId,
            toId: payment.toId,
            amount: payment.amount,
          });
        } catch (error) {
          devLog("Backend confirm failed, using local storage");
        }
      }
      
      setPendingPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { 
          ...p, 
          status: "accepted" as const,
          response: "accepted" as const,
          respondedAt: Date.now()
        } : p))
      );
      toast.success("Bien remboursé !");
      refetch();
      return;
    }
    
    // If current user is the one who requested money (toId), they are confirming receipt
    if (payment.toId === currentMemberId) {
      if (!isNetlify) {
        try {
          await confirmPaymentMutation.mutateAsync({
            paymentId,
            fromId: payment.fromId,
            toId: payment.toId,
            amount: payment.amount,
          });
        } catch (error) {
          devLog("Backend confirm failed, using local storage");
        }
      }
      
      // Mark as completed and move to history
      const completedPayment: PendingPayment = {
        ...payment,
        status: "completed" as const,
        confirmedBy: currentMemberId,
        respondedAt: Date.now()
      };
      
      setPendingPayments((prev) => prev.filter(p => p.id !== paymentId));
      setCompletedPayments((prev) => [completedPayment, ...prev].slice(0, 50)); // Keep last 50
      toast.success("Bien reçu !");
      refetch();
      return;
    }
    
    toast.error("Action non autorisée");
  }, [currentMemberId, pendingPayments, haptic, confirmPaymentMutation, refetch, isNetlify]);

  const refusePayment = useCallback(async (paymentId: string) => {
    haptic("medium");
    const payment = pendingPayments.find((p) => p.id === paymentId);
    if (!payment) return;
    
    // Only the person who owes money can refuse
    if (payment.fromId === currentMemberId) {
      if (!isNetlify) {
        try {
          await refusePaymentMutation.mutateAsync({ paymentId });
        } catch (error) {
          devLog("Backend refuse failed, using local storage");
        }
      }
      
      setPendingPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { 
          ...p, 
          status: "refused" as const,
          response: "refused" as const,
          respondedAt: Date.now()
        } : p))
      );
      toast("Remboursement refusé");
      return;
    }
    
    toast.error("Seul le débiteur peut refuser le paiement");
  }, [currentMemberId, pendingPayments, haptic, refusePaymentMutation, isNetlify]);

  // ─── Render Screens ─────────────────────────────────────────────────────────
  if (screen === "access") {
    return (
      <AppShell>
        <AccessScreen onSubmit={handleAccessCode} />
      </AppShell>
    );
  }

  if (screen === "identity") {
    return (
      <AppShell>
        <IdentityScreen members={members} onSelect={selectIdentity} />
      </AppShell>
    );
  }

  if (screen === "register") {
    return (
      <AppShell>
        <RegisterScreen onRegister={handleRegister} />
      </AppShell>
    );
  }

  if (screen === "lock") {
    const isLocked = !!localStorage.getItem('equilibra_locked_member');
    return (
      <AppShell>
        <LockScreen
          member={currentMember!}
          onUnlock={handleBiometricUnlock}
          onSkip={() => setScreen("main")}
          onSwitchIdentity={isLocked ? undefined : () => setScreen("identity")}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-24">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <HomeTab
              key="home"
              currentMember={currentMember!}
              balance={balances[currentMemberId] || 0}
              totalSpent={expenses.reduce((s, e) => s + e.amount, 0)}
              expenseCount={expenses.length}
              recentExpenses={expenses.slice(-5).reverse()}
              members={members}
              pendingPayments={pendingPayments.filter((p) => 
                (p.fromId === currentMemberId || p.toId === currentMemberId) && 
                p.status !== "completed"
              )}
              completedPayments={completedPayments.filter((p) => 
                p.fromId === currentMemberId || p.toId === currentMemberId
              )}
              onConfirmPayment={confirmPayment}
              onRefusePayment={refusePayment}
              expenses={expenses}
              monthlyBudget={monthlyBudget}
              onUpdateBudget={updateBudget}
            />
          )}
          {activeTab === "expenses" && (
            <ExpensesTab
              key="expenses"
              expenses={expenses}
              members={members}
              currentMemberId={currentMemberId}
              onDelete={deleteExpense}
              onAdd={() => setShowAddExpense(true)}
              onRequestPayment={requestPayment}
            />
          )}
          {activeTab === "balances" && (
            <BalancesTab
              key="balances"
              members={members}
              balances={balances}
              transactions={suggestedTransactions}
              currentMemberId={currentMemberId}
              onRequestPayment={requestPayment}
              expenses={expenses}
            />
          )}
          {activeTab === "stats" && (
            <StatsTab key="stats" expenses={expenses} members={members} currentMemberId={currentMemberId} />
          )}
          {activeTab === "profile" && (
            <ProfileTab
              key="profile"
              currentMember={currentMember!}
              members={members}
              biometricEnabled={biometricEnabled[currentMemberId] || false}
              biometricAvailable={biometricAvailable}
              onToggleBiometric={toggleBiometric}
              onLogout={handleLogout}
              onAddMember={currentMemberId === "admin" ? addMember : undefined}
              onRemoveMember={currentMemberId === "admin" ? removeMember : undefined}
              theme={theme}
              onToggleTheme={toggleTheme}
              isLocked={!!localStorage.getItem('equilibra_locked_member')}
            />
          )}
        </AnimatePresence>

        {/* Bottom Navigation - iOS style */}
        <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-2xl border-t border-white/5 z-50 safe-area-bottom">
          <div className="max-w-md mx-auto flex justify-around items-center h-20 px-2">
            {([
              { id: "home" as Tab, icon: Home, label: "Accueil" },
              { id: "expenses" as Tab, icon: Receipt, label: "Dépenses" },
              { id: "balances" as Tab, icon: Scale, label: "Soldes" },
              { id: "stats" as Tab, icon: BarChart3, label: "Stats" },
              { id: "profile" as Tab, icon: User, label: "Profil" },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => tab.id === "profile" ? handleProfileAccess() : setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-2xl transition-all duration-300 press-scale ${
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                <div className="relative">
                  <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 1.8} />
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                      transition={spring}
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Floating Add Button */}
        {activeTab === "expenses" && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAddExpense(true)}
            className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/40 z-40"
          >
            <Plus size={24} />
          </motion.button>
        )}

        {/* Add Expense Sheet */}
        <AnimatePresence>
          {showAddExpense && (
            <AddExpenseSheet
              members={members}
              currentMemberId={currentMemberId}
              onAdd={addExpense}
              onClose={() => setShowAddExpense(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster position="top-center" richColors theme="dark" />
          {children}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// ─── Access Screen ───────────────────────────────────────────────────────────
function AccessScreen({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const haptic = useHaptic();

  const handleSubmit = () => {
    if (code.trim()) {
      setLoading(true);
      haptic("success");
      setTimeout(() => {
        onSubmit(code.trim());
        setLoading(false);
      }, 300);
    } else {
      haptic("error");
      toast.error("Veuillez entrer le code confidentiel");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
        />
      </div>

      <motion.div {...fadeUp} className="text-center mb-12 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, ...spring }}
          className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10"
        >
          <Shield size={28} className="text-primary" />
        </motion.div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Équilibra</h1>
        <p className="text-muted-foreground text-sm">Entrez le code confidentiel</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ...spring }}
        className="w-full max-w-xs relative z-10 space-y-4"
      >
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Code confidentiel"
          className="w-full px-6 py-4 rounded-2xl bg-card/50 border border-white/5 focus:border-primary/30 focus:bg-card focus:shadow-xl focus:shadow-primary/5 transition-all duration-300 text-center text-lg font-semibold tracking-widest"
          maxLength={20}
          autoFocus
        />
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={loading || !code.trim()}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl disabled:opacity-50"
        >
          {loading ? "Vérification..." : "Accéder"}
        </motion.button>
      </motion.div>
    </div>
  );
}

// ─── Identity Screen ──────────────────────────────────────────────────────────
function IdentityScreen({ members, onSelect }: { members: Member[]; onSelect: (id: string) => void }) {
  const haptic = useHaptic();

  const handleSelect = (id: string) => {
    haptic("medium");
    onSelect(id);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
        />
      </div>

      <motion.div {...fadeUp} className="text-center mb-12 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, ...spring }}
          className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10"
        >
          <Sparkles size={28} className="text-primary" />
        </motion.div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Équilibra</h1>
        <p className="text-muted-foreground text-sm">Sélectionnez votre profil</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xs relative z-10">
        {members.map((member, i) => (
          <motion.button
            key={member.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08, ...spring }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleSelect(member.id)}
            className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-card/50 border border-white/5 hover:border-primary/30 hover:bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 press-scale backdrop-blur-sm"
          >
            <motion.span 
              className="text-4xl"
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              {member.avatar}
            </motion.span>
            <span className="text-sm font-semibold">{member.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Register Screen ──────────────────────────────────────────────────────────
function RegisterScreen({ onRegister }: { onRegister: (name: string, avatar: string) => void }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("👤");
  const haptic = useHaptic();

  const handleSubmit = () => {
    if (name.trim()) {
      haptic("success");
      onRegister(name.trim(), avatar);
    } else {
      haptic("error");
      toast.error("Veuillez entrer votre nom");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
        />
      </div>

      <motion.div {...fadeUp} className="text-center mb-12 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, ...spring }}
          className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10"
        >
          <Sparkles size={28} className="text-primary" />
        </motion.div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Rejoindre le groupe</h1>
        <p className="text-muted-foreground text-sm">Créez votre profil</p>
      </motion.div>

      <div className="w-full max-w-sm space-y-6 relative z-10">
        <div>
          <label className="text-xs text-muted-foreground font-medium mb-2 block uppercase tracking-wide">Votre nom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Marie"
            className="w-full bg-card/50 border border-white/5 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20 transition-all"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium mb-2 block uppercase tracking-wide">Choisissez votre avatar</label>
          <div className="grid grid-cols-4 gap-3">
            {["👤", "👩", "👨", "🧑", "👩‍🦰", "👨‍🦱", "👧", "👦"].map((emoji) => (
              <motion.button
                key={emoji}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  haptic("light");
                  setAvatar(emoji);
                }}
                className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                  avatar === emoji
                    ? "bg-primary/20 border-2 border-primary shadow-lg shadow-primary/20"
                    : "bg-card/50 border border-white/5 hover:bg-card/80"
                }`}
              >
                <span className="text-3xl">{emoji}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-xl shadow-primary/25 text-base disabled:opacity-50"
        >
          Rejoindre
        </motion.button>
      </div>
    </div>
  );
}

// ─── Lock Screen ──────────────────────────────────────────────────────────────
function LockScreen({ member, onUnlock, onSkip, onSwitchIdentity }: { member: Member; onUnlock: () => void; onSkip: () => void; onSwitchIdentity?: () => void }) {
  const [authenticating, setAuthenticating] = useState(false);
  const [authStatus, setAuthStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const haptic = useHaptic();

  const handleUnlock = async () => {
    haptic("medium");
    setAuthenticating(true);
    setAuthStatus("scanning");
    await onUnlock();
    // Success is determined by screen change to main (handled by parent)
    // If we're still on lock screen after a delay, it failed
    setTimeout(() => {
      if (authenticating) {
        haptic("error");
        setAuthStatus("error");
        setAuthenticating(false);
      }
    }, 3000);
  };

  // Auto-trigger biometric on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleUnlock();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
        />
      </div>

      <motion.div {...fadeUp} className="text-center relative z-10">
        {/* Avatar with ring animation */}
        <div className="relative mb-8">
          {/* Scanning ring */}
          <motion.div
            animate={authStatus === "scanning" ? {
              rotate: 360,
              scale: [1, 1.05, 1],
            } : {}}
            transition={authStatus === "scanning" ? {
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
            } : {}}
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            style={{ width: "140px", height: "140px", margin: "-10px" }}
          />
          
          {/* Inner glow */}
          <motion.div
            animate={authStatus === "scanning" ? {
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.1, 1],
            } : authStatus === "success" ? {
              opacity: [1, 0],
              scale: [1, 2],
            } : {}}
            transition={authStatus === "scanning" ? {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            } : authStatus === "success" ? {
              duration: 0.5,
            } : {}}
            className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
          />

          {/* Success checkmark */}
          <AnimatePresence>
            {authStatus === "success" && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/50">
                  <Check size={40} className="text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Avatar */}
          <motion.div
            animate={authStatus === "scanning" ? {
              scale: [1, 1.02, 1],
            } : {}}
            transition={authStatus === "scanning" ? {
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            } : {}}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-sm"
          >
            <span className="text-6xl">{member.avatar}</span>
          </motion.div>
        </div>

        {/* Name and status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-2 tracking-tight">{member.name}</h2>
          <motion.p
            key={authStatus}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm font-medium mb-10 ${
              authStatus === "success" ? "text-green-400" : 
              authStatus === "error" ? "text-red-400" : 
              "text-muted-foreground"
            }`}
          >
            {authStatus === "scanning" && "Vérification biométrique..."}
            {authStatus === "success" && "Authentification réussie"}
            {authStatus === "error" && "Échec de l'authentification"}
            {authStatus === "idle" && "Utilisez Face ID ou Touch ID"}
          </motion.p>
        </motion.div>

        {/* Biometric button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={handleUnlock}
          disabled={authenticating}
          className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {/* Button glow */}
          <motion.div
            animate={authStatus === "scanning" ? {
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.2, 1],
            } : {}}
            transition={authStatus === "scanning" ? {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            } : {}}
            className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
          />
          
          <Fingerprint 
            size={44} 
            className={`text-primary relative z-10 ${
              authStatus === "scanning" ? "animate-pulse" : ""
            }`}
          />
        </motion.button>

        {/* Skip button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 underline-offset-4 hover:underline font-medium mb-4"
        >
          Continuer sans biométrie
        </motion.button>

        {/* Switch identity button */}
        {onSwitchIdentity && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onSwitchIdentity}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 underline-offset-4 hover:underline font-medium"
          >
            Changer de compte
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

// ─── Home Tab ─────────────────────────────────────────────────────────────────
function HomeTab({
  currentMember,
  balance,
  totalSpent,
  expenseCount,
  recentExpenses,
  members,
  pendingPayments,
  completedPayments,
  onConfirmPayment,
  onRefusePayment,
  expenses,
  monthlyBudget,
  onUpdateBudget,
}: {
  currentMember: Member;
  balance: number;
  totalSpent: number;
  expenseCount: number;
  recentExpenses: Expense[];
  members: Member[];
  pendingPayments: PendingPayment[];
  completedPayments: PendingPayment[];
  onConfirmPayment: (id: string) => void;
  onRefusePayment: (id: string) => void;
  expenses: Expense[];
  monthlyBudget: number;
  onUpdateBudget: (budget: number) => void;
}) {
  const breakdown = useMemo(() => 
    calculateMemberBreakdown(currentMember.id, expenses, members),
    [currentMember.id, expenses, members]
  );

  // Calculate current month spending
  const currentMonthSpending = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return expenses
      .filter((e) => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const budgetPercentage = useMemo(() => {
    if (monthlyBudget === 0) return 0;
    return Math.min((currentMonthSpending / monthlyBudget) * 100, 100);
  }, [currentMonthSpending, monthlyBudget]);

  const budgetRemaining = monthlyBudget - currentMonthSpending;

  return (
    <motion.div {...fadeUp} className="max-w-md mx-auto px-5 pt-16 space-y-6">
      {/* Greeting */}
      <div>
        <p className="text-muted-foreground text-sm font-medium">Bonjour,</p>
        <h1 className="text-2xl font-bold tracking-tight">{currentMember.name} {currentMember.avatar}</h1>
      </div>

      {/* Balance Card - Premium Glass */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, ...spring }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 text-primary-foreground shadow-2xl shadow-primary/30"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-10 -translate-x-10 blur-lg" />
        <div className="relative z-10">
          <p className="text-sm opacity-80 mb-1 font-medium">Votre solde</p>
          <p className="text-4xl font-bold tracking-tight">{formatCurrency(balance)}</p>
          <div className="flex items-center gap-1.5 mt-3">
            {balance > 0 ? <TrendingUp size={14} /> : balance < 0 ? <TrendingDown size={14} /> : null}
            <p className="text-xs opacity-80">
              {balance > 0 ? "On vous doit de l'argent" : balance < 0 ? "Vous devez de l'argent" : "Tout est équilibré ✨"}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] opacity-70 uppercase tracking-wide">Vous avez payé</p>
              <p className="text-lg font-semibold">{formatCurrency(breakdown.totalPaid)}</p>
            </div>
            <div>
              <p className="text-[10px] opacity-70 uppercase tracking-wide">Votre part</p>
              <p className="text-lg font-semibold">{formatCurrency(breakdown.totalShare)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Monthly Budget Tracker */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">Budget mensuel</h3>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(currentMonthSpending)} / {formatCurrency(monthlyBudget)}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const newBudget = prompt("Entrez votre budget mensuel:", monthlyBudget.toString());
              if (newBudget && !isNaN(parseFloat(newBudget))) {
                onUpdateBudget(parseFloat(newBudget));
              }
            }}
            className="text-xs text-primary font-medium"
          >
            Modifier
          </motion.button>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 bg-secondary rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${budgetPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full rounded-full ${
              budgetPercentage > 90 ? "bg-red-500" : budgetPercentage > 70 ? "bg-yellow-500" : "bg-primary"
            }`}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {budgetRemaining >= 0 
              ? `${formatCurrency(budgetRemaining)} restants` 
              : `${formatCurrency(Math.abs(budgetRemaining))} dépassé`}
          </span>
          <span className={`font-medium ${
            budgetPercentage > 90 ? "text-red-500" : budgetPercentage > 70 ? "text-yellow-500" : "text-primary"
          }`}>
            {budgetPercentage.toFixed(0)}%
          </span>
        </div>
      </motion.div>

      {/* Detailed Breakdown */}
      {(breakdown.owesTo.length > 0 || breakdown.owedBy.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4"
        >
          <h3 className="text-sm font-semibold mb-3">Détail des comptes</h3>
          
          {breakdown.owesTo.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Vous devez :</p>
              <div className="space-y-2">
                {breakdown.owesTo.slice(0, 3).map((debt, i) => {
                  const to = members.find((m) => m.id === debt.to);
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{to?.avatar}</span>
                        <div>
                          <p className="font-medium">{to?.name}</p>
                          <p className="text-xs text-muted-foreground">{debt.reason}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-red-400">{formatCurrency(debt.amount)}</p>
                    </div>
                  );
                })}
                {breakdown.owesTo.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    + {breakdown.owesTo.length - 3} autres dépenses
                  </p>
                )}
              </div>
            </div>
          )}

          {breakdown.owedBy.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">On vous doit :</p>
              <div className="space-y-2">
                {breakdown.owedBy.slice(0, 3).map((debt, i) => {
                  const from = members.find((m) => m.id === debt.from);
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{from?.avatar}</span>
                        <div>
                          <p className="font-medium">{from?.name}</p>
                          <p className="text-xs text-muted-foreground">{debt.reason}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-green-400">{formatCurrency(debt.amount)}</p>
                    </div>
                  );
                })}
                {breakdown.owedBy.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    + {breakdown.owedBy.length - 3} autres dépenses
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4"
        >
          <p className="text-[11px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">Total dépensé</p>
          <p className="text-xl font-bold">{formatCurrency(totalSpent)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4"
        >
          <p className="text-[11px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">Dépenses</p>
          <p className="text-xl font-bold">{expenseCount}</p>
        </motion.div>
      </div>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            Remboursements
          </h3>
          <div className="space-y-2">
            {pendingPayments.map((p) => {
              const from = members.find((m) => m.id === p.fromId);
              const to = members.find((m) => m.id === p.toId);
              const isFromCurrentUser = p.fromId === currentMember.id;
              const isToCurrentUser = p.toId === currentMember.id;
              
              // Don't show completed payments
              if (p.status === "completed") return null;
              
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 ${
                    p.status === "accepted" ? "border-green-500/20 bg-green-500/5" :
                    p.status === "refused" ? "border-red-500/20 bg-red-500/5" :
                    ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{from?.avatar}</span>
                      <div>
                        <p className="text-sm font-medium">
                          {isFromCurrentUser ? "Vous demandez" : `${from?.name} demande`}
                          {isToCurrentUser ? " à vous" : ` à ${to?.name}`}
                        </p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(p.amount)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        p.status === "pending" ? "bg-orange-500/10 text-orange-400" :
                        p.status === "accepted" ? "bg-green-500/10 text-green-400" :
                        p.status === "refused" ? "bg-red-500/10 text-red-400" :
                        "bg-gray-500/10 text-gray-400"
                      }`}>
                        {p.status === "pending" ? "En attente" :
                         p.status === "accepted" ? "Accepté" :
                         p.status === "refused" ? "Refusé" :
                         p.status}
                      </span>
                      {p.notificationCount > 1 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {p.notificationCount} rappels
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions based on status and user */}
                  {p.status === "pending" && (
                    <div className="flex gap-2 justify-end">
                      {isFromCurrentUser && (
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => onRefusePayment(p.id)}
                          className="px-3 py-1.5 rounded-full bg-red-500/15 text-red-400 text-xs font-medium border border-red-500/20"
                        >
                          Annuler
                        </motion.button>
                      )}
                      {isToCurrentUser && (
                        <>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => onRefusePayment(p.id)}
                            className="px-3 py-1.5 rounded-full bg-red-500/15 text-red-400 text-xs font-medium border border-red-500/20"
                          >
                            Refuser
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => onConfirmPayment(p.id)}
                            className="px-3 py-1.5 rounded-full bg-green-500/15 text-green-400 text-xs font-medium border border-green-500/20"
                          >
                            Accepter
                          </motion.button>
                        </>
                      )}
                    </div>
                  )}
                  
                  {p.status === "accepted" && isToCurrentUser && (
                    <div className="flex gap-2 justify-end">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => onConfirmPayment(p.id)}
                        className="px-3 py-1.5 rounded-full bg-green-500/15 text-green-400 text-xs font-medium border border-green-500/20"
                      >
                        Bien reçu
                      </motion.button>
                    </div>
                  )}
                  
                  {p.status === "accepted" && isFromCurrentUser && (
                    <div className="flex gap-2 justify-end">
                      <span className="text-xs text-green-400 font-medium">
                        Bien remboursé ✓
                      </span>
                    </div>
                  )}
                  
                  {p.status === "refused" && isFromCurrentUser && (
                    <p className="text-xs text-muted-foreground text-right">
                      Demande refusée par {to?.name}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Payments History */}
      {completedPayments.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            Historique des remboursements
          </h3>
          <div className="space-y-2">
            {completedPayments.slice(0, 5).map((p) => {
              const from = members.find((m) => m.id === p.fromId);
              const to = members.find((m) => m.id === p.toId);
              
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-card/30 backdrop-blur-sm border border-white/5 rounded-2xl p-3 flex items-center justify-between opacity-70"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{from?.avatar}</span>
                    <div>
                      <p className="text-xs font-medium">
                        {from?.name} → {to?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.respondedAt ? formatDate(p.respondedAt) : ""}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-green-400">{formatCurrency(p.amount)}</p>
                </motion.div>
              );
            })}
            {completedPayments.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                + {completedPayments.length - 5} autres remboursements
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Activité récente</h3>
        <div className="space-y-2">
          {recentExpenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <div className="text-4xl mb-3">💸</div>
              Aucune dépense pour le moment
            </div>
          ) : (
            recentExpenses.map((exp, i) => {
              const payer = members.find((m) => m.id === exp.payerId);
              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 flex items-center gap-3"
                >
                  <div className="w-11 h-11 rounded-2xl bg-secondary/50 flex items-center justify-center text-lg">
                    {exp.categoryEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{exp.description}</p>
                    <p className="text-xs text-muted-foreground">{payer?.name} • {formatDate(exp.date)}</p>
                  </div>
                  <p className="text-sm font-bold">{formatCurrency(exp.amount)}</p>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Expenses Tab ─────────────────────────────────────────────────────────────
function ExpensesTab({
  expenses,
  members,
  currentMemberId,
  onDelete,
  onAdd,
  onRequestPayment,
}: {
  expenses: Expense[];
  members: Member[];
  currentMemberId: string;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onRequestPayment: (toId: string, amount: number, expenseId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = expenses
    .filter((e) => e.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date - a.date);

  return (
    <motion.div {...fadeUp} className="max-w-md mx-auto px-5 pt-16 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dépenses</h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onAdd}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30"
        >
          <Plus size={20} />
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher une dépense..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20 transition-all"
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <div className="text-4xl mb-3">🔍</div>
            Aucune dépense trouvée
          </div>
        ) : (
          filtered.map((exp, i) => {
            const payer = members.find((m) => m.id === exp.payerId);
            const perPerson = exp.amount / exp.participants.length;
            const userShare = exp.participants.includes(currentMemberId) ? perPerson : 0;
            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-secondary/50 flex items-center justify-center text-xl">
                    {exp.categoryEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{exp.description}</p>
                    <p className="text-xs text-muted-foreground">{payer?.name} • {formatDate(exp.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(exp.amount)}</p>
                    <p className="text-[10px] text-muted-foreground">{exp.participants.length} pers.</p>
                  </div>
                </div>
                
                {/* Expense breakdown */}
                <div className="bg-background/30 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Payé par {payer?.name}</span>
                    <span className="font-semibold">{formatCurrency(exp.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Part par personne</span>
                    <span className="font-semibold">{formatCurrency(perPerson)}</span>
                  </div>
                  {exp.participants.includes(currentMemberId) && (
                    <div className="flex items-center justify-between text-xs bg-primary/10 rounded-lg p-2 -mx-2">
                      <span className="text-primary font-medium">Votre part</span>
                      <span className="font-bold text-primary">{formatCurrency(userShare)}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {exp.participants.map((pid) => {
                      const participant = members.find((m) => m.id === pid);
                      return (
                        <span key={pid} className="text-xs bg-background/50 px-2 py-1 rounded-full flex items-center gap-1">
                          <span className="text-sm">{participant?.avatar}</span>
                          {participant?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    {exp.payerId === currentMemberId && (
                      <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-1 rounded-full">Vous avez payé</span>
                    )}
                    {exp.participants.includes(currentMemberId) && exp.payerId !== currentMemberId && (
                      <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full">Vous devez {formatCurrency(userShare)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {exp.payerId === currentMemberId && exp.participants.length > 1 && (
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => {
                          // Request payment from the first participant (for simplicity)
                          const otherParticipant = exp.participants.find(p => p !== currentMemberId);
                          if (otherParticipant) {
                            onRequestPayment(otherParticipant, perPerson, exp.id);
                          }
                        }}
                        className="text-[10px] bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-medium hover:bg-primary/90 transition-colors"
                      >
                        Demander remboursement
                      </motion.button>
                    )}
                    {exp.payerId === currentMemberId && (
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => onDelete(exp.id)}
                        className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/10"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

// ─── Balances Tab ─────────────────────────────────────────────────────────────
function BalancesTab({
  members,
  balances,
  transactions,
  currentMemberId,
  onRequestPayment,
  expenses,
}: {
  members: Member[];
  balances: Record<string, number>;
  transactions: Array<{ from: string; to: string; amount: number; explanation: string }>;
  currentMemberId: string;
  onRequestPayment: (toId: string, amount: number) => void;
  expenses: Expense[];
}) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  
  const selectedBreakdown = useMemo(() => 
    selectedMember ? calculateMemberBreakdown(selectedMember, expenses, members) : null,
    [selectedMember, expenses, members]
  );

  return (
    <motion.div {...fadeUp} className="max-w-md mx-auto px-5 pt-16 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Soldes</h1>

      {/* Member Balances */}
      <div className="space-y-2">
        {members.map((member, i) => {
          const memberBalance = balances[member.id];
          const memberOwesMoney = memberBalance < -0.01 && member.id !== currentMemberId;
          
          return (
            <motion.button
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
              className={`w-full bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 flex items-center gap-3 transition-all ${
                selectedMember === member.id ? 'border-primary/30 bg-card/70' : 'hover:border-primary/20'
              }`}
            >
              <span className="text-3xl">{member.avatar}</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">{member.name}</p>
                <p className="text-xs text-muted-foreground">
                  {memberBalance > 0.01 ? "Créancier" : memberBalance < -0.01 ? "Débiteur" : "Équilibré"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className={`text-lg font-bold ${
                  memberBalance > 0.01 ? "text-green-400" : memberBalance < -0.01 ? "text-red-400" : "text-muted-foreground"
                }`}>
                  {memberBalance > 0 ? "+" : ""}{formatCurrency(memberBalance)}
                </p>
                {memberOwesMoney && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestPayment(member.id, Math.abs(memberBalance));
                    }}
                    className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    Demander
                  </button>
                )}
                <ChevronRight 
                  size={16} 
                  className={`text-muted-foreground transition-transform ${
                    selectedMember === member.id ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Detailed Member Breakdown */}
      <AnimatePresence>
        {selectedMember && selectedBreakdown && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Détail pour {members.find(m => m.id === selectedMember)?.name}</h3>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">A payé</p>
                <p className="text-lg font-bold">{formatCurrency(selectedBreakdown.totalPaid)}</p>
              </div>
              <div className="bg-background/50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sa part</p>
                <p className="text-lg font-bold">{formatCurrency(selectedBreakdown.totalShare)}</p>
              </div>
            </div>

            {selectedBreakdown.owesTo.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Doit à :</p>
                <div className="space-y-2">
                  {selectedBreakdown.owesTo.slice(0, 5).map((debt, i) => {
                    const to = members.find((m) => m.id === debt.to);
                    return (
                      <div key={i} className="flex items-center justify-between text-sm bg-background/30 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{to?.avatar}</span>
                          <div>
                            <p className="font-medium">{to?.name}</p>
                            <p className="text-[10px] text-muted-foreground">{debt.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-red-400">{formatCurrency(debt.amount)}</p>
                          {selectedMember === currentMemberId && (
                            <button
                              onClick={() => onRequestPayment(debt.to, debt.amount)}
                              className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                            >
                              Demander
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {selectedBreakdown.owesTo.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      + {selectedBreakdown.owesTo.length - 5} autres
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedBreakdown.owedBy.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Est dû par :</p>
                <div className="space-y-2">
                  {selectedBreakdown.owedBy.slice(0, 5).map((debt, i) => {
                    const from = members.find((m) => m.id === debt.from);
                    return (
                      <div key={i} className="flex items-center justify-between text-sm bg-background/30 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{from?.avatar}</span>
                          <div>
                            <p className="font-medium">{from?.name}</p>
                            <p className="text-[10px] text-muted-foreground">{debt.reason}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-green-400">{formatCurrency(debt.amount)}</p>
                      </div>
                    );
                  })}
                  {selectedBreakdown.owedBy.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      + {selectedBreakdown.owedBy.length - 5} autres
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggested Transactions */}
      {transactions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            Remboursements optimisés
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Ces paiements minimisent le nombre de transactions pour équilibrer les comptes
          </p>
          <div className="space-y-2">
            {transactions.map((t, i) => {
              const from = members.find((m) => m.id === t.from);
              const to = members.find((m) => m.id === t.to);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{from?.avatar}</span>
                      <ArrowUpRight size={16} className="text-primary" />
                      <span className="text-xl">{to?.avatar}</span>
                    </div>
                    <p className="text-base font-bold">{formatCurrency(t.amount)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {from?.name} doit {formatCurrency(t.amount)} à {to?.name}
                  </p>
                  {t.to === currentMemberId && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onRequestPayment(t.from, t.amount)}
                      className="mt-3 w-full bg-primary/10 text-primary text-xs font-semibold py-2.5 rounded-xl border border-primary/20 press-scale"
                    >
                      Demander le remboursement
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Stats Tab (with Recharts) ───────────────────────────────────────────────
function StatsTab({ expenses, members, currentMemberId }: { expenses: Expense[]; members: Member[]; currentMemberId: string }) {
  // Filter expenses for current member only
  const memberExpenses = useMemo(() => {
    return expenses.filter(e => e.payerId === currentMemberId || e.participants.includes(currentMemberId));
  }, [expenses, currentMemberId]);

  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    memberExpenses.forEach((e) => {
      const key = `${e.categoryEmoji} ${e.category}`;
      totals[key] = (totals[key] || 0) + e.amount;
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [memberExpenses]);

  const memberData = useMemo(() => {
    const totals: Record<string, number> = {};
    memberExpenses.forEach((e) => {
      totals[e.payerId] = (totals[e.payerId] || 0) + e.amount;
    });
    return members.map((m) => ({
      name: m.avatar + " " + m.name,
      total: Math.round((totals[m.id] || 0) * 100) / 100,
    }));
  }, [memberExpenses, members]);

  const trendData = useMemo(() => {
    const byDay: Record<string, number> = {};
    memberExpenses.forEach((e) => {
      const day = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(new Date(e.date));
      byDay[day] = (byDay[day] || 0) + e.amount;
    });
    return Object.entries(byDay)
      .map(([date, total]) => ({ date, total: Math.round(total * 100) / 100 }))
      .slice(-10);
  }, [memberExpenses]);

  // Monthly breakdown
  const monthlyData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    memberExpenses.forEach((e) => {
      const month = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(new Date(e.date));
      byMonth[month] = (byMonth[month] || 0) + e.amount;
    });
    return Object.entries(byMonth)
      .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }))
      .slice(-6);
  }, [memberExpenses]);

  // Average per person
  const averagePerPerson = useMemo(() => {
    if (members.length === 0) return 0;
    const total = memberExpenses.reduce((s, e) => s + e.amount, 0);
    return Math.round((total / members.length) * 100) / 100;
  }, [memberExpenses, members]);

  // Most expensive category
  const topCategory = useMemo(() => {
    if (categoryData.length === 0) return null;
    return categoryData[0];
  }, [categoryData]);

  const totalExpenses = memberExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <motion.div {...fadeUp} className="relative max-w-md mx-auto px-5 pt-12 space-y-6 overflow-hidden">
      <div className="pointer-events-none absolute -top-20 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute top-64 -left-28 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-enhanced relative overflow-hidden rounded-[2rem] p-6"
      >
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles size={12} />
              Aperçu intelligent
            </div>
            <h1 className="text-3xl font-bold tracking-[-0.04em]">Statistiques</h1>
            <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
              Une vision claire de vos dépenses et de leur évolution.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-primary to-violet-500 text-white shadow-lg shadow-primary/25">
            <BarChart3 size={22} />
          </div>
        </div>
      </motion.header>

      {memberExpenses.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <div className="text-5xl mb-4">📊</div>
          Ajoutez des dépenses pour voir les statistiques
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card-enhanced rounded-[1.5rem] p-4 text-center"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(totalExpenses)}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="glass-card-enhanced rounded-[1.5rem] p-4 text-center"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Moyenne/personne</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(averagePerPerson)}</p>
            </motion.div>
          </div>

          {/* Top Category */}
          {topCategory && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card-enhanced relative overflow-hidden rounded-[1.75rem] border-primary/20 p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary font-semibold uppercase tracking-wide">Catégorie principale</p>
                  <p className="text-lg font-bold mt-1">{topCategory.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{formatCurrency(topCategory.value)}</p>
                  <p className="text-xs text-muted-foreground">{Math.round((topCategory.value / totalExpenses) * 100)}% du total</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Pie Chart - By Category */}
          <div className="glass-card-enhanced relative overflow-hidden rounded-[1.75rem] p-5">
            <h3 className="text-sm font-semibold mb-4">Par catégorie</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [formatCurrency(value), "Montant"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {categoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground truncate">{cat.name}</span>
                  <span className="ml-auto font-medium">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart - By Member */}
          <div className="glass-card-enhanced relative overflow-hidden rounded-[1.75rem] p-5">
            <h3 className="text-sm font-semibold mb-4">Par membre</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }}
                    formatter={(value: number) => [formatCurrency(value), "Dépensé"]}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line Chart - Trend */}
          {trendData.length > 1 && (
            <div className="glass-card-enhanced relative overflow-hidden rounded-[1.75rem] p-5">
              <h3 className="text-sm font-semibold mb-4">Tendance (10 derniers jours)</h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }}
                      formatter={(value: number) => [formatCurrency(value), "Total"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Monthly Breakdown */}
          {monthlyData.length > 1 && (
            <div className="glass-card-enhanced relative overflow-hidden rounded-[1.75rem] p-5">
              <h3 className="text-sm font-semibold mb-4">Historique mensuel</h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }}
                      formatter={(value: number) => [formatCurrency(value), "Total"]}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({
  currentMember,
  members,
  biometricEnabled,
  biometricAvailable,
  onToggleBiometric,
  onLogout,
  onAddMember,
  onRemoveMember,
  theme,
  onToggleTheme,
  isLocked,
}: {
  currentMember: Member;
  members: Member[];
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  onToggleBiometric: () => void;
  onLogout: () => void;
  onAddMember?: (name: string, avatar: string) => void;
  onRemoveMember?: (memberId: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  isLocked: boolean;
}) {
  const shareUrl = window.location.href;
  const haptic = useHaptic();

  const copyLink = async () => {
    haptic("light");
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Lien copié !");
      haptic("success");
    } catch {
      toast.error("Impossible de copier le lien");
      haptic("error");
    }
  };

  const shareLink = async () => {
    haptic("light");
    if (navigator.share) {
      try {
        await navigator.share({ title: "Équilibra Groupe", text: "Rejoignez notre groupe !", url: shareUrl });
      } catch { /* cancelled */ }
    } else {
      copyLink();
    }
  };

  return (
    <motion.div {...fadeUp} className="max-w-md mx-auto px-5 pt-16 space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6"
      >
        <motion.div 
          className="relative inline-block"
          whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-sm mb-4">
            <span className="text-6xl">{currentMember.avatar}</span>
          </div>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-primary/10 blur-xl -z-10"
          />
          {/* Admin Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-background"
          >
            <Sparkles size={14} className="text-white" />
          </motion.div>
        </motion.div>
        <h1 className="text-2xl font-bold tracking-tight">{currentMember.name}</h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-sm text-muted-foreground">Membre du groupe</span>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold border border-primary/20">Admin</span>
        </div>
      </motion.div>

      {/* Security Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-lg shadow-primary/5"
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"
            >
              <Fingerprint size={20} className="text-primary" />
            </motion.div>
            <div>
              <p className="text-sm font-semibold">Face ID / Touch ID</p>
              <p className="text-xs text-muted-foreground">
                {biometricAvailable ? "Verrouillage biométrique" : "Non disponible sur cet appareil"}
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToggleBiometric}
            disabled={!biometricAvailable}
            className={`w-[52px] h-8 rounded-full transition-all duration-300 relative ${
              biometricEnabled ? "bg-primary shadow-lg shadow-primary/30" : "bg-secondary"
            } ${!biometricAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <motion.div
              animate={{ x: biometricEnabled ? 22 : 3 }}
              transition={spring}
              className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md"
            />
          </motion.button>
        </div>
      </motion.div>

      {/* Theme Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 shadow-lg shadow-primary/5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"
            >
              {theme === "dark" ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-primary" />}
            </motion.div>
            <div>
              <p className="text-sm font-semibold">Mode sombre</p>
              <p className="text-xs text-muted-foreground">
                {theme === "dark" ? "Thème sombre activé" : "Thème clair activé"}
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              haptic("medium");
              onToggleTheme();
            }}
            className={`w-[52px] h-8 rounded-full transition-all duration-300 relative ${
              theme === "dark" ? "bg-primary shadow-lg shadow-primary/30" : "bg-secondary"
            }`}
          >
            <motion.div
              animate={{ x: theme === "dark" ? 22 : 3 }}
              transition={spring}
              className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md"
            />
          </motion.button>
        </div>
      </motion.div>

      {/* Share Section - Admin Only */}
      {currentMember.id === "admin" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm border border-primary/20 rounded-2xl overflow-hidden shadow-lg shadow-primary/10"
        >
          <div className="p-4 bg-primary/10 border-b border-primary/20">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <p className="text-sm font-bold text-primary">Inviter des amis</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Partagez l'application avec vos amis</p>
          </div>

          {/* QR Code - Always Visible */}
          <div className="p-6 flex flex-col items-center">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-5 shadow-2xl mb-4"
            >
              <QRCodeSVG
                value={`${shareUrl}?invite=true`}
                size={200}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </motion.div>
            
            <p className="text-xs text-center text-muted-foreground mb-4">
              Scannez ce QR code pour rejoindre le groupe
            </p>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={copyLink}
                className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl press-scale flex items-center justify-center gap-2"
              >
                <Copy size={16} />
                Copier le lien
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={shareLink}
                className="flex-1 bg-secondary text-secondary-foreground font-semibold py-3 rounded-xl press-scale flex items-center justify-center gap-2"
              >
                <Share2 size={16} />
                Partager
              </motion.button>
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="bg-background/50 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground text-center">
                🔒 Seul l'administrateur peut inviter de nouveaux membres
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Members */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-lg shadow-primary/5"
      >
        <div className="p-4 pb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Membres du groupe</p>
            <p className="text-xs text-muted-foreground">{members.length} membres</p>
          </div>
        </div>
        {members.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.05 }}
            whileHover={{ backgroundColor: "hsl(var(--card)/70)" }}
            className="px-4 py-3.5 flex items-center gap-3 border-t border-white/5 cursor-pointer"
          >
            <motion.span 
              className="text-2xl"
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.3 }}
            >
              {member.avatar}
            </motion.span>
            <p className="text-sm font-medium flex-1">{member.name}</p>
            {member.id === currentMember.id && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-[10px] text-primary font-semibold bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20"
              >
                Vous
              </motion.span>
            )}
            {onRemoveMember && currentMember.id === "admin" && member.id !== currentMember.id && (
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => onRemoveMember(member.id)}
                className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/10"
              >
                <X size={14} />
              </motion.button>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Switch Account - Available for all users except locked */}
      {!isLocked && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => {
            haptic("medium");
            onLogout();
          }}
          className="w-full bg-primary/10 text-primary font-semibold py-3.5 rounded-2xl border border-primary/20 press-scale shadow-lg shadow-primary/5"
        >
          Changer de compte
        </motion.button>
      )}

      {/* Logout - Admin Only and Not Locked */}
      {!isLocked && currentMember.id === "admin" && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => {
            haptic("medium");
            onLogout();
          }}
          className="w-full bg-red-500/10 text-red-400 font-semibold py-3.5 rounded-2xl border border-red-500/10 press-scale shadow-lg shadow-red-500/5"
        >
          Changer d'identité
        </motion.button>
      )}

      {/* Clear All Data - Available for Mohamed */}
      {currentMember.name === "Mohamed" && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => {
            haptic("heavy");
            if (window.confirm("Êtes-vous sûr de vouloir effacer toutes les données ? Cette action est irréversible.")) {
              localStorage.clear();
              sessionStorage.clear();
              toast.success("Toutes les données ont été effacées");
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          }}
          className="w-full bg-red-500/20 text-red-400 font-semibold py-3.5 rounded-2xl border border-red-500/20 press-scale shadow-lg shadow-red-500/10"
        >
          🗑️ Effacer toutes les données
        </motion.button>
      )}

      <div className="h-4" />
    </motion.div>
  );
}

// ─── Add Expense Sheet ────────────────────────────────────────────────────────
function AddExpenseSheet({
  members,
  currentMemberId,
  onAdd,
  onClose,
}: {
  members: Member[];
  currentMemberId: string;
  onAdd: (expense: Omit<Expense, "id" | "date">) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [payerId, setPayerId] = useState(currentMemberId);
  const [participants, setParticipants] = useState(members.map((m) => m.id));

  const toggleParticipant = (id: string) => {
    setParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Veuillez entrer un montant");
      return;
    }
    if (participants.length === 0) {
      toast.error("Sélectionnez au moins un participant");
      return;
    }
    onAdd({
      description: category.name,
      amount: parseFloat(amount),
      payerId,
      category: category.name,
      categoryEmoji: category.emoji,
      participants,
    });
    onClose();
  };

  const steps = [
    {
      title: "Combien avez-vous dépensé ?",
      content: (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-card/50 border border-white/5 rounded-3xl px-6 py-6 text-5xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20 transition-all"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-2xl">MAD</span>
          </div>
          <div className="flex gap-2 justify-center">
            {[50, 100, 200, 500].map((val) => (
              <motion.button
                key={val}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAmount(val.toString())}
                className="px-4 py-2 rounded-xl bg-secondary/50 text-sm font-semibold hover:bg-secondary/70 transition-colors"
              >
                {val}
              </motion.button>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "C'est pour quoi ?",
      content: (
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.name}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategory(cat)}
              className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${
                category.name === cat.name
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-card/50 border border-white/5 hover:bg-card/80"
              }`}
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-xs font-semibold">{cat.name}</span>
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      title: "Qui a payé ?",
      content: (
        <div className="space-y-2">
          {members.map((member) => (
            <motion.button
              key={member.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPayerId(member.id)}
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                payerId === member.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-card/50 border border-white/5 hover:bg-card/80"
              }`}
            >
              <span className="text-3xl">{member.avatar}</span>
              <span className="font-semibold flex-1 text-left">{member.name}</span>
              {payerId === member.id && <Check size={20} />}
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      title: "Qui participe ?",
      content: (
        <div className="space-y-2">
          {members.map((member) => (
            <motion.button
              key={member.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleParticipant(member.id)}
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                participants.includes(member.id)
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-card/50 border border-white/5 hover:bg-card/80 opacity-50"
              }`}
            >
              <span className="text-3xl">{member.avatar}</span>
              <span className="font-semibold flex-1 text-left">{member.name}</span>
              {participants.includes(member.id) && <Check size={20} />}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setParticipants(members.map((m) => m.id))}
            className="w-full p-3 rounded-xl bg-secondary/50 text-sm font-semibold text-center"
          >
            Tout sélectionner
          </motion.button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 bg-background rounded-t-[2.5rem] max-h-[92vh] overflow-y-auto"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-background z-10">
          <div className="w-10 h-1.5 rounded-full bg-muted-foreground/20" />
        </div>

        <div className="px-6 pb-10 space-y-6">
          {/* Progress */}
          <div className="flex items-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-all ${
                  i <= step ? "bg-primary" : "bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{steps[step].title}</h2>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center"
            >
              <X size={16} />
            </motion.button>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {steps[step].content}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            {step > 0 && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep(step - 1)}
                className="flex-1 bg-secondary text-secondary-foreground font-semibold py-4 rounded-2xl"
              >
                Retour
              </motion.button>
            )}
            {step < steps.length - 1 ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep(step + 1)}
                disabled={step === 0 && !amount}
                className="flex-1 bg-primary text-primary-foreground font-semibold py-4 rounded-2xl disabled:opacity-50"
              >
                Suivant
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={participants.length === 0}
                className="flex-1 bg-primary text-primary-foreground font-semibold py-4 rounded-2xl disabled:opacity-50"
              >
                Confirmer
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default App;
