import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Fingerprint, Moon, Sun, Sparkles, Copy, Share2, X, DollarSign, Bell, Shield, Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useThemeContext } from "../contexts/ThemeContext";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import type { Member } from "../types";
import { fadeUp, spring } from "../constants";
import { useHaptic } from "../hooks/useHaptic";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { AvatarImg } from "../components/AvatarImg";

export function ProfileTab({
  currentMember,
  members,
  biometricEnabled,
  biometricAvailable,
  onToggleBiometric,
  onLogout,
  onAddMember,
  onRemoveMember,
  isLocked,
  unreadCount,
  onOpenNotifications,
  onOpenReports,
  onOpenGroupSettings,
  onOpenMembers,
  onResetAllData,
  onLeaveGroup,
  currency,
  onSetCurrency,
  monthlyBudget,
  onSetBudget,
  pushNotifications,
  onTogglePushNotifications,
  autoReminders,
  onToggleReminders,
  reminderDelay,
  onSetReminderDelay,
  privacyMode,
  onTogglePrivacy,
}: {
  currentMember: Member;
  members: Member[];
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  onToggleBiometric: () => void;
  onLogout: () => void;
  onAddMember?: (name: string, avatar: string) => void;
  onRemoveMember?: (memberId: string) => void;
  isLocked: boolean;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onOpenReports?: () => void;
  onOpenGroupSettings?: () => void;
  onOpenMembers?: () => void;
  onResetAllData?: () => void;
  onLeaveGroup?: () => void;
  currency: string;
  onSetCurrency: (c: string) => void;
  monthlyBudget: number;
  onSetBudget: (b: number) => void;
  pushNotifications: boolean;
  onTogglePushNotifications: () => void;
  autoReminders: boolean;
  onToggleReminders: () => void;
  reminderDelay: number;
  onSetReminderDelay: (d: number) => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
}) {
  const { theme, toggleTheme } = useThemeContext();
  const shareUrl = window.location.origin;
  const haptic = useHaptic();
  const [inviteTokenValue, setInviteTokenValue] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const [budgetInput, setBudgetInput] = useState(monthlyBudget.toString());
  const generateInviteMutation = trpc.equilibra.generateInvite.useMutation();

  const handleGenerateInvite = async () => {
    try {
      const result = await generateInviteMutation.mutateAsync({});
      if (result?.token) {
        setInviteTokenValue(result.token);
      }
    } catch {
      toast.error("Erreur lors de la génération du lien d'invitation");
    }
  };

  useEffect(() => {
    if (!inviteTokenValue) {
      handleGenerateInvite();
    }
  }, []);

  const inviteLink = inviteTokenValue ? `${shareUrl}?invite=${inviteTokenValue}` : "";

  const copyLink = async () => {
    haptic("light");
    try {
      await navigator.clipboard.writeText(inviteLink);
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
        await navigator.share({ title: "Équilibra Groupe", text: "Rejoignez notre groupe !", url: inviteLink });
      } catch { /* cancelled */ }
    } else {
      copyLink();
    }
  };

  const currencies = [
    { code: "MAD", symbol: "DH", label: "Dirham marocain" },
    { code: "EUR", symbol: "€", label: "Euro" },
    { code: "USD", symbol: "$", label: "Dollar américain" },
  ];

  const ToggleSwitch = ({ enabled, onToggle, disabled }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) => (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => { if (!disabled) { haptic("medium"); onToggle(); } }}
      className={`w-[52px] h-8 rounded-full transition-all duration-300 relative ${
        enabled ? "bg-primary shadow-lg shadow-primary/30" : "bg-secondary"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <motion.div
        animate={{ x: enabled ? 22 : 3 }}
        transition={spring}
        className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md"
      />
    </motion.button>
  );

  const SettingRow = ({ icon, iconBg, title, subtitle, children }: {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
  }) => (
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center border border-primary/20`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );

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
            <AvatarImg avatar={currentMember.avatar} size="text-6xl" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-primary/10 blur-xl -z-10"
          />
          {currentMember.role === "admin" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-background"
            >
              <Sparkles size={14} className="text-white" />
            </motion.div>
          )}
        </motion.div>
        <h1 className="text-2xl font-bold tracking-tight">{currentMember.name}</h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-sm text-muted-foreground">Membre du groupe</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${currentMember.role === "admin" ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary text-muted-foreground border-border"}`}>{currentMember.role === "admin" ? "Admin" : "Membre"}</span>
        </div>
      </motion.div>

      {/* ─── PARAMÈTRES ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">Paramètres</p>

        {/* Devise */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden shadow-lg shadow-primary/5 mb-3">
          <SettingRow
            icon={<DollarSign size={20} className="text-primary" />}
            iconBg="bg-primary/10"
            title="Devise"
            subtitle={currencies.find(c => c.code === currency)?.label}
          >
            <div className="flex gap-1">
              {currencies.map((c) => (
                <motion.button
                  key={c.code}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { haptic("light"); onSetCurrency(c.code); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currency === c.code
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {c.symbol}
                </motion.button>
              ))}
            </div>
          </SettingRow>
        </div>

        {/* Budget */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden shadow-lg shadow-primary/5 mb-3">
          <SettingRow
            icon={<DollarSign size={20} className="text-emerald-500" />}
            iconBg="bg-emerald-500/10"
            title="Budget mensuel"
            subtitle={monthlyBudget.toLocaleString("fr-MA") + " " + currency}
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                haptic("light");
                setBudgetInput(monthlyBudget.toString());
                setShowBudgetInput(!showBudgetInput);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-all"
            >
              Modifier
            </motion.button>
          </SettingRow>
          {showBudgetInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4"
            >
              <div className="flex gap-2">
                {[500, 1000, 2000, 5000].map((v) => (
                  <motion.button
                    key={v}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { haptic("light"); setBudgetInput(v.toString()); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      budgetInput === v.toString()
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    {v.toLocaleString()}
                  </motion.button>
                ))}
              </div>
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = parseFloat(budgetInput);
                    if (!isNaN(v) && v > 0) {
                      onSetBudget(v);
                      setShowBudgetInput(false);
                      haptic("success");
                    }
                  }
                }}
                className="w-full mt-2 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Montant"
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const v = parseFloat(budgetInput);
                  if (!isNaN(v) && v > 0) {
                    onSetBudget(v);
                    setShowBudgetInput(false);
                    haptic("success");
                  }
                }}
                className="w-full mt-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold"
              >
                Enregistrer
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden shadow-lg shadow-primary/5 mb-3">
          <div className="p-4 pb-2 flex items-center gap-2">
            <Bell size={14} className="text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notifications</p>
          </div>
          <SettingRow
            icon={<Bell size={20} className="text-blue-500" />}
            iconBg="bg-blue-500/10"
            title="Notifications push"
            subtitle="Recevoir les alertes sur cet appareil"
          >
            <ToggleSwitch enabled={pushNotifications} onToggle={onTogglePushNotifications} />
          </SettingRow>
          <SettingRow
            icon={<Clock size={20} className="text-orange-500" />}
            iconBg="bg-orange-500/10"
            title="Rappels automatiques"
            subtitle="Relancer les membres en retard"
          >
            <ToggleSwitch enabled={autoReminders} onToggle={onToggleReminders} />
          </SettingRow>
          {autoReminders && (
            <div className="px-4 pb-4">
              <p className="text-xs text-muted-foreground mb-2">Délai avant rappel</p>
              <div className="flex gap-2">
                {[1, 2, 3, 5, 7].map((d) => (
                  <motion.button
                    key={d}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { haptic("light"); onSetReminderDelay(d); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      reminderDelay === d
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    {d}j
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sécurité & Confidentialité */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden shadow-lg shadow-primary/5 mb-3">
          <div className="p-4 pb-2 flex items-center gap-2">
            <Shield size={14} className="text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sécurité</p>
          </div>
          <SettingRow
            icon={<Fingerprint size={20} className="text-primary" />}
            iconBg="bg-primary/10"
            title="Face ID / Touch ID"
            subtitle={biometricAvailable ? "Verrouillage biométrique" : "Non disponible"}
          >
            <ToggleSwitch enabled={biometricEnabled} onToggle={onToggleBiometric} disabled={!biometricAvailable} />
          </SettingRow>
          <SettingRow
            icon={<Shield size={20} className="text-purple-500" />}
            iconBg="bg-purple-500/10"
            title="Mode privé"
            subtitle="Masquer les montants dans l'app"
          >
            <ToggleSwitch enabled={privacyMode} onToggle={onTogglePrivacy} />
          </SettingRow>
        </div>

        {/* Apparence */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden shadow-lg shadow-primary/5">
          <div className="p-4 pb-2 flex items-center gap-2">
            <Moon size={14} className="text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Apparence</p>
          </div>
          <SettingRow
            icon={theme === "dark" ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-primary" />}
            iconBg="bg-primary/10"
            title="Mode sombre"
            subtitle={theme === "dark" ? "Thème sombre activé" : "Thème clair activé"}
          >
            <ToggleSwitch enabled={theme === "dark"} onToggle={() => { haptic("medium"); toggleTheme(); }} />
          </SettingRow>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {onOpenNotifications && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { haptic("light"); onOpenNotifications(); }}
            className="p-4 rounded-2xl bg-card border border-border flex flex-col items-center gap-2 relative"
          >
            <span className="text-2xl">🔔</span>
            <span className="text-xs font-medium">Notifications</span>
            {unreadCount && unreadCount > 0 ? (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            ) : null}
          </motion.button>
        )}
        {onOpenReports && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.17 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { haptic("light"); onOpenReports(); }}
            className="p-4 rounded-2xl bg-card border border-border flex flex-col items-center gap-2"
          >
            <span className="text-2xl">📊</span>
            <span className="text-xs font-medium">Rapports</span>
          </motion.button>
        )}
        {onOpenGroupSettings && currentMember.role === "admin" && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.19 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { haptic("light"); onOpenGroupSettings(); }}
            className="p-4 rounded-2xl bg-card border border-border flex flex-col items-center gap-2"
          >
            <span className="text-2xl">👥</span>
            <span className="text-xs font-medium">Groupe</span>
          </motion.button>
        )}
        {onOpenMembers && currentMember.role === "admin" && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.21 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { haptic("light"); onOpenMembers(); }}
            className="p-4 rounded-2xl bg-card border border-border flex flex-col items-center gap-2"
          >
            <span className="text-2xl">⚙️</span>
            <span className="text-xs font-medium">Membres</span>
          </motion.button>
        )}
      </div>

      {/* Share Section - Admin Only */}
      {currentMember.role === "admin" && (
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

          <div className="p-6 flex flex-col items-center">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-5 shadow-2xl mb-4"
            >
              <QRCodeSVG
                value={inviteLink}
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
        className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden shadow-lg shadow-primary/5"
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
            className="px-4 py-3.5 flex items-center gap-3 border-t border-border cursor-pointer"
          >
            <motion.span 
              className="text-2xl"
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.3 }}
            >
              <AvatarImg avatar={member.avatar} size="text-2xl" />
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
            {onRemoveMember && currentMember.role === "admin" && member.id !== currentMember.id && (
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

      {/* Switch Account */}
      {!isLocked && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => { haptic("medium"); onLogout(); }}
          className="w-full bg-primary/10 text-primary font-semibold py-3.5 rounded-2xl border border-primary/20 press-scale shadow-lg shadow-primary/5"
        >
          Changer de compte
        </motion.button>
      )}

      {/* Leave Group */}
      {!isLocked && currentMember.role !== "admin" && onLeaveGroup && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => { haptic("heavy"); setShowLeaveConfirm(true); }}
          className="w-full bg-red-500/10 text-red-400 font-semibold py-3.5 rounded-2xl border border-red-500/10 press-scale shadow-lg shadow-red-500/5"
        >
          Quitter le groupe
        </motion.button>
      )}

      <ConfirmDialog
        open={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={() => onLeaveGroup?.()}
        title="Quitter le groupe ?"
        description="Vos dépenses et profil seront supprimés. Cette action est irréversible."
        confirmLabel="Quitter"
        variant="danger"
        icon="logout"
      />

      {/* Logout - Admin */}
      {!isLocked && currentMember.role === "admin" && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => { haptic("medium"); onLogout(); }}
          className="w-full bg-red-500/10 text-red-400 font-semibold py-3.5 rounded-2xl border border-red-500/10 press-scale shadow-lg shadow-red-500/5"
        >
          Changer d'identité
        </motion.button>
      )}

      {/* Reset All Data */}
      {!isLocked && currentMember.role === "admin" && onResetAllData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => { haptic("heavy"); setShowResetConfirm(true); }}
            className="w-full bg-red-500/20 text-red-400 font-semibold py-3.5 rounded-2xl border border-red-500/20 press-scale shadow-lg shadow-red-500/10 flex items-center justify-center gap-2"
          >
            🗑️ Réinitialiser toutes les données
          </motion.button>
        </motion.div>
      )}

      <ConfirmDialog
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => onResetAllData?.()}
        title="Réinitialiser toutes les données ?"
        description="Toutes les dépenses, paiements, historique, notifications et membres invités seront supprimés. Seul le groupe sera conservé."
        confirmLabel="Tout supprimer"
        variant="danger"
        icon="trash"
      />

      <div className="h-4" />
    </motion.div>
  );
}
