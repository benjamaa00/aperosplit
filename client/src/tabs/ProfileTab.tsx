import { memo, useState, useEffect } from "react";
import { Fingerprint, Moon, Sun, Sparkles, Copy, Share2, X, DollarSign, Bell, BarChart3, Users, Settings, Shield, Trash2, Clock, Loader2, QrCode, ChevronRight, Pencil, Tag, Smartphone, HelpCircle, Play, Camera, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useThemeContext } from "../contexts/ThemeContext";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import type { Member } from "../types";
import { useHaptic } from "../hooks/useHaptic";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { AvatarImg } from "../components/AvatarImg";
import { Toggle } from "../components/Toggle";
import { areHapticsEnabled, setHapticsEnabled } from "../utils/haptics";
import { isTutorialCompleted, getTutorialStep } from "../utils/tutorialStorage";
import { MAIN_TUTORIAL_ID } from "../constants";

const COVER_GRADIENTS = [
  { label: "Violet", value: "from-violet-500/40 via-violet-500/20 to-violet-500/5" },
  { label: "Bleu", value: "from-blue-500/40 via-blue-500/20 to-blue-500/5" },
  { label: "Vert", value: "from-emerald-500/40 via-emerald-500/20 to-emerald-500/5" },
  { label: "Rose", value: "from-pink-500/40 via-pink-500/20 to-pink-500/5" },
  { label: "Orange", value: "from-orange-500/40 via-orange-500/20 to-orange-500/5" },
  { label: "Rouge", value: "from-red-500/40 via-red-500/20 to-red-500/5" },
  { label: "Ambre", value: "from-amber-500/40 via-amber-500/20 to-amber-500/5" },
  { label: "Teal", value: "from-teal-500/40 via-teal-500/20 to-teal-500/5" },
  { label: "Indigo", value: "from-indigo-500/40 via-indigo-500/20 to-indigo-500/5" },
  { label: "Pourpre", value: "from-purple-500/40 via-purple-500/20 to-purple-500/5" },
];

const COVER_STORAGE_KEY = "equilibra_cover_gradient";

function SettingRow({ icon, iconBg, title, subtitle, children }: {
 icon: React.ReactNode;
 iconBg: string;
 title: string;
 subtitle?: string;
 children: React.ReactNode;
}) {
 return (
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
}

export const ProfileTab = memo(function ProfileTab({
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
 onOpenAppearance,
 onOpenEditProfile,
 onOpenCategories,
 onReplayTutorial,
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
 onOpenAppearance?: () => void;
 onOpenEditProfile?: () => void;
 onOpenCategories?: () => void;
 onReplayTutorial?: (id: string) => void;
}) {
  const { theme, toggleTheme } = useThemeContext();
  const shareUrl = window.location.origin;
  const haptic = useHaptic();
  const [inviteTokenValue, setInviteTokenValue] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const [budgetInput, setBudgetInput] = useState(monthlyBudget.toString());
  const [hapticsOn, setHapticsOn] = useState(areHapticsEnabled());
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [coverGradient, setCoverGradient] = useState(() => {
    try { return localStorage.getItem(COVER_STORAGE_KEY) || COVER_GRADIENTS[0].value; }
    catch { return COVER_GRADIENTS[0].value; }
  });
  const generateInviteMutation = trpc.equilibra.generateInvite.useMutation();

 const handleGenerateInvite = async () => {
 setInviteLoading(true);
 try {
 const result = await generateInviteMutation.mutateAsync({});
 if (result?.token) {
 setInviteTokenValue(result.token);
 }
 } catch {
 toast.error("Erreur lors de la génération du lien d'invitation");
 } finally {
 setInviteLoading(false);
 }
 };

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
  return (
    <div className="max-w-md mx-auto px-5 pt-12 space-y-6">
      {/* Cover Photo + Profile Picture */}
      <div className="relative -mx-5">
        <button
          onClick={() => { haptic("light"); setShowCoverPicker(true); }}
          className="relative w-full block group text-left"
        >
          <div className={`h-36 bg-gradient-to-br ${coverGradient} rounded-b-2xl transition-all duration-500`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg border border-border/30">
            <Camera size={16} className="text-foreground" />
          </div>
        </button>
        <button
          onClick={() => { haptic("light"); onOpenEditProfile?.(); }}
          className="absolute -bottom-12 left-5 z-10 group"
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl border-4 border-background shadow-xl overflow-hidden bg-card transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-primary/20">
              <AvatarImg avatar={currentMember.avatar} size="text-6xl" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={22} className="text-white" />
            </div>
            {currentMember.role === "admin" && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-background">
                <Sparkles size={14} className="text-white" />
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Name & Role */}
      <div className="pt-14">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{currentMember.name}</h1>
          <button
            onClick={() => { haptic("light"); onOpenEditProfile?.(); }}
            className="w-8 h-8 rounded-xl bg-card/50 border border-border/50 flex items-center justify-center hover:bg-card/80 transition-all"
          >
            <Pencil size={13} className="text-muted-foreground" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm text-muted-foreground">Membre du groupe</span>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${currentMember.role === "admin" ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary text-muted-foreground border-border"}`}>{currentMember.role === "admin" ? "Admin" : "Membre"}</span>
        </div>
      </div>

  {/* ── Cover Gradient Picker ── */}
  {showCoverPicker && (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowCoverPicker(false)}>
      <div
        className="w-full max-w-sm bg-card border border-border rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Couleur de couverture</h2>
            <button onClick={() => setShowCoverPicker(false)} className="w-8 h-8 rounded-xl bg-muted/30 flex items-center justify-center">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Choisissez un dégradé pour votre profil</p>
        </div>
        <div className="p-5 grid grid-cols-5 gap-3">
          {COVER_GRADIENTS.map((g) => (
            <button
              key={g.value}
              onClick={() => {
                haptic("light");
                setCoverGradient(g.value);
                try { localStorage.setItem(COVER_STORAGE_KEY, g.value); } catch {}
                setShowCoverPicker(false);
              }}
              className={`aspect-[3/2] rounded-2xl bg-gradient-to-br ${g.value} border-2 transition-all ${
                coverGradient === g.value ? "border-primary shadow-lg shadow-primary/20 scale-110" : "border-transparent hover:border-border/50"
              }`}
              title={g.label}
            >
              {coverGradient === g.value && (
                <div className="w-full h-full flex items-center justify-center">
                  <Check size={16} className="text-white drop-shadow-lg" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* ─── PARAMÈTRES ────────────────────────────────── */}
 <div
 
 
 
 >
 <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">Paramètres</p>

 {/* Devise */}
 <div data-tutorial="profile-settings" className="glass-card-enhanced rounded-2xl overflow-hidden mb-3">
 <SettingRow
 icon={<DollarSign size={20} className="text-primary" />}
 iconBg="bg-primary/10"
 title="Devise"
 subtitle={currencies.find(c => c.code === currency)?.label}
 >
 <div className="flex gap-1">
 {currencies.map((c) => (
 <button
 key={c.code}
 onClick={() => { haptic("light"); onSetCurrency(c.code); }}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
 currency === c.code
 ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
 : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
 }`}
 >
 {c.symbol}
 </button>
 ))}
 </div>
 </SettingRow>
 </div>

 {/* Budget */}
 <div className="glass-card-enhanced rounded-2xl overflow-hidden mb-3">
 <SettingRow
 icon={<DollarSign size={20} className="text-emerald-500" />}
 iconBg="bg-emerald-500/10"
 title="Budget mensuel"
 subtitle={monthlyBudget.toLocaleString("fr-MA") + " " + currency}
 >
 <button
 onClick={() => {
 haptic("light");
 setBudgetInput(monthlyBudget.toString());
 setShowBudgetInput(!showBudgetInput);
 }}
 className="px-3 py-1.5 rounded-lg text-xs font-bold bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-all"
 >
 Modifier
 </button>
 </SettingRow>
 {showBudgetInput && (
 <div
 className="px-4 pb-4"
 >
 <div className="flex gap-2">
 {[500, 1000, 2000, 5000].map((v) => (
 <button
 key={v}
 onClick={() => { haptic("light"); setBudgetInput(v.toString()); }}
 className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
 budgetInput === v.toString()
 ? "bg-primary text-primary-foreground"
 : "bg-muted/30 text-muted-foreground"
 }`}
 >
 {v.toLocaleString()}
 </button>
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
 <button
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
 </button>
 </div>
 )}
 </div>

 {/* Notifications */}
 <div data-tutorial="profile-notifications" className="glass-card-enhanced rounded-2xl overflow-hidden mb-3">
 <div className="p-4 pb-2 flex items-center gap-2">
 <Bell size={14} className="text-muted-foreground" />
 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notifications</p>
 </div>
 <SettingRow
 icon={<Bell size={20} className="text-blue-500" />}
 iconBg="bg-blue-500/10"
 title="Notifications push"
 subtitle={pushNotifications ? "Activ\u00e9es \u2014 vous recevrez des alertes" : "D\u00e9sactiv\u00e9es"}
 >
 <Toggle enabled={pushNotifications} onToggle={onTogglePushNotifications} />
 </SettingRow>
 <SettingRow
 icon={<Clock size={20} className="text-orange-500" />}
 iconBg="bg-orange-500/10"
 title="Rappels automatiques"
 subtitle="Relancer les membres en retard"
 >
 <Toggle enabled={autoReminders} onToggle={onToggleReminders} />
 </SettingRow>
 {autoReminders && (
 <div className="px-4 pb-4">
 <p className="text-xs text-muted-foreground mb-2">Délai avant rappel</p>
 <div className="flex gap-2">
 {[1, 2, 3, 5, 7].map((d) => (
 <button
 key={d}
 onClick={() => { haptic("light"); onSetReminderDelay(d); }}
 className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
 reminderDelay === d
 ? "bg-primary text-primary-foreground shadow-md"
 : "bg-muted/30 text-muted-foreground"
 }`}
 >
 {d}j
 </button>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* Sécurité & Confidentialité */}
 <div data-tutorial="profile-security" className="glass-card-enhanced rounded-2xl overflow-hidden mb-3">
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
 <Toggle enabled={biometricEnabled} onToggle={onToggleBiometric} disabled={!biometricAvailable} />
 </SettingRow>
 <SettingRow
 icon={<Shield size={20} className="text-purple-500" />}
 iconBg="bg-purple-500/10"
 title="Mode privé"
 subtitle="Masquer les montants dans l'app"
 >
 <Toggle enabled={privacyMode} onToggle={onTogglePrivacy} />
 </SettingRow>
 <SettingRow
 icon={<Smartphone size={20} className="text-orange-500" />}
 iconBg="bg-orange-500/10"
 title="Vibrations"
 subtitle="Retour haptique pour les interactions"
 >
 <Toggle enabled={hapticsOn} onToggle={() => { setHapticsOn(!hapticsOn); setHapticsEnabled(!hapticsOn); }} />
 </SettingRow>
 </div>

 {/* Apparence */}
 <div className="glass-card-enhanced rounded-2xl overflow-hidden">
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
 <Toggle enabled={theme === "dark"} onToggle={() => { haptic("medium"); toggleTheme(); }} />
 </SettingRow>
 {onOpenAppearance && (
 <button
 onClick={() => { haptic("light"); onOpenAppearance(); }}
 className="w-full p-4 flex items-center justify-between bg-card/50 border border-border rounded-2xl"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
 <Sparkles size={20} className="text-primary" />
 </div>
 <div>
 <p className="text-sm font-semibold">Apparence & Thèmes</p>
 <p className="text-xs text-muted-foreground">Thèmes, dégradés, arrière-plans, personnalisation</p>
 </div>
 </div>
 <ChevronRight size={16} className="text-muted-foreground/50" />
 </button>
  )}
  </div>

  {/* Catégories */}
  {onOpenCategories && currentMember.role === "admin" && (
  <div className="glass-card-enhanced rounded-2xl overflow-hidden">
  <button
  data-tutorial="profile-categories"
  onClick={() => { haptic("light"); onOpenCategories(); }}
  className="w-full p-4 flex items-center justify-between hover:bg-card/60 transition-colors"
  >
  <div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
  <Tag size={20} className="text-primary" />
  </div>
  <div>
  <p className="text-sm font-semibold">Catégories</p>
  <p className="text-xs text-muted-foreground">Gérer les catégories de dépenses</p>
  </div>
  </div>
  <ChevronRight size={16} className="text-muted-foreground/50" />
  </button>
  </div>
  )}
  </div>

 {/* Quick Actions */}
 <div className="grid grid-cols-2 gap-3">
 {onOpenNotifications && (
 <button
 
 
 
 onClick={() => { haptic("light"); onOpenNotifications(); }}
 className="p-4 rounded-2xl bg-card border border-border flex flex-col items-center gap-2 relative"
 >
 <Bell size={20} />
 <span className="text-xs font-medium">Notifications</span>
 {unreadCount && unreadCount > 0 ? (
 <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
 {unreadCount}
 </span>
 ) : null}
 </button>
 )}
 {onOpenReports && (
 <button
 
 
 
 onClick={() => { haptic("light"); onOpenReports(); }}
 className="p-4 rounded-2xl bg-card border border-border flex flex-col items-center gap-2"
 >
 <BarChart3 size={20} />
 <span className="text-xs font-medium">Rapports</span>
 </button>
 )}
 {onOpenGroupSettings && currentMember.role === "admin" && (
 <button
 
 
 
 onClick={() => { haptic("light"); onOpenGroupSettings(); }}
 className="p-4 rounded-2xl bg-card border border-border flex flex-col items-center gap-2"
 >
 <Users size={20} />
 <span className="text-xs font-medium">Groupe</span>
 </button>
 )}
 {onOpenMembers && currentMember.role === "admin" && (
 <button
 
 
 
 onClick={() => { haptic("light"); onOpenMembers(); }}
 className="p-4 rounded-2xl bg-card border border-border flex flex-col items-center gap-2"
 >
 <Settings size={20} />
 <span className="text-xs font-medium">Membres</span>
 </button>
 )}
 </div>

 {/* Share Section - Admin Only */}
 {currentMember.role === "admin" && (
 <div
 
 
 
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
 {inviteTokenValue ? (
 <div 
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
 </div>
 ) : (
 <button
 onClick={handleGenerateInvite}
 disabled={inviteLoading}
 className="bg-white/50 border border-dashed border-primary/30 rounded-3xl w-[210px] h-[210px] flex flex-col items-center justify-center gap-3 mb-4 hover:bg-white/80 transition-colors"
 >
 {inviteLoading ? (
 <Loader2 size={28} className="text-primary animate-spin" />
 ) : (
 <QrCode size={28} className="text-primary" />
 )}
 <span className="text-xs text-muted-foreground font-medium">
 {inviteLoading ? "Génération..." : "Générer le QR code"}
 </span>
 </button>
 )}
 
 <p className="text-xs text-center text-muted-foreground mb-4">
 {inviteTokenValue ? "Scannez ce QR code pour rejoindre le groupe" : "Générez un lien d'invitation"}
 </p>

 <div className="flex gap-2 w-full">
 {inviteTokenValue ? (
 <>
 <button
 onClick={copyLink}
 className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl press-scale flex items-center justify-center gap-2"
 >
 <Copy size={16} />
 Copier le lien
 </button>
 <button
 onClick={shareLink}
 className="flex-1 bg-secondary text-secondary-foreground font-semibold py-3 rounded-xl press-scale flex items-center justify-center gap-2"
 >
 <Share2 size={16} />
 Partager
 </button>
 </>
 ) : (
 <button
 onClick={handleGenerateInvite}
 disabled={inviteLoading}
 className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl press-scale flex items-center justify-center gap-2 disabled:opacity-40"
 >
 {inviteLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
 Générer un lien
 </button>
 )}
 </div>
 </div>

 <div className="px-4 pb-4">
 <div className="bg-background/50 rounded-xl p-3">
 <p className="text-[10px] text-muted-foreground text-center">
 🔒 Seul l'administrateur peut inviter de nouveaux membres
 </p>
 </div>
 </div>
 </div>
 )}

 {/* Members */}
 <div
 data-tutorial="profile-members"
 className="glass-card-enhanced rounded-2xl overflow-hidden"
 >
 <div className="p-4 pb-2 flex items-center justify-between">
 <div>
 <p className="text-sm font-semibold">Membres du groupe</p>
 <p className="text-xs text-muted-foreground">{members.length} membres</p>
 </div>
 </div>
 {members.map((member, i) => (
 <div
 key={member.id}
 className="px-4 py-3.5 flex items-center gap-3 border-t border-border cursor-pointer hover:bg-card/60 transition-colors duration-200"
 >
 <span 
 className="text-2xl"
 
 >
 <AvatarImg avatar={member.avatar} size="text-2xl" />
 </span>
 <p className="text-sm font-medium flex-1">{member.name}</p>
 {member.id === currentMember.id && (
 <span 
 
 
 className="text-[10px] text-primary font-semibold bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20"
 >
 Vous
 </span>
 )}
 {onRemoveMember && currentMember.role === "admin" && member.id !== currentMember.id && (
 <button
 onClick={() => onRemoveMember(member.id)}
 className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/10"
 >
 <X size={14} />
 </button>
 )}
 </div>
 ))}
 </div>

 {/* ─── AIDE & TUTORIELS ──────────────────────────── */}
 <div
 data-tutorial="profile-help"
 className="glass-card-enhanced rounded-2xl overflow-hidden"
 >
 <div className="p-4 pb-2 flex items-center justify-between">
 <div>
 <p className="text-sm font-semibold">Aide & Tutoriels</p>
 <p className="text-xs text-muted-foreground">Apprenez à utiliser l'application</p>
 </div>
 <HelpCircle size={16} className="text-muted-foreground" />
 </div>
 <button
 onClick={() => onReplayTutorial?.(MAIN_TUTORIAL_ID)}
 className="w-full px-4 py-3 flex items-center gap-3 hover:bg-card/60 transition-colors"
 >
 <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
 <Play size={18} className="text-blue-400" />
 </div>
 <div className="text-left flex-1">
 <p className="text-sm font-medium">Rejouer le tutoriel</p>
 <p className="text-xs text-muted-foreground">
 {isTutorialCompleted(MAIN_TUTORIAL_ID) ? "Revoir la visite guidée de l'application" : "Commencer la visite guidée"}
 </p>
 </div>
 </button>
 </div>

 {/* Switch Account */}
 {!isLocked && (
 <button
 
 
 
 onClick={() => { haptic("medium"); onLogout(); }}
 className="w-full bg-primary/10 text-primary font-semibold py-3.5 rounded-2xl border border-primary/20 press-scale shadow-lg shadow-primary/5"
 >
 Changer de compte
 </button>
 )}

 {/* Leave Group */}
 {!isLocked && currentMember.role !== "admin" && onLeaveGroup && (
 <button
 
 
 
 onClick={() => { haptic("heavy"); setShowLeaveConfirm(true); }}
 className="w-full bg-red-500/10 text-red-400 font-semibold py-3.5 rounded-2xl border border-red-500/10 press-scale shadow-lg shadow-red-500/5"
 >
 Quitter le groupe
 </button>
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
 <button
 
 
 
 onClick={() => { haptic("medium"); onLogout(); }}
 className="w-full bg-red-500/10 text-red-400 font-semibold py-3.5 rounded-2xl border border-red-500/10 press-scale shadow-lg shadow-red-500/5"
 >
 Changer d'identité
 </button>
 )}

 {/* Reset All Data */}
 {!isLocked && currentMember.role === "admin" && onResetAllData && (
 <div
 
 
 
 >
 <button
 onClick={() => { haptic("heavy"); setShowResetConfirm(true); }}
 className="w-full bg-red-500/20 text-red-400 font-semibold py-3.5 rounded-2xl border border-red-500/20 press-scale shadow-lg shadow-red-500/10 flex items-center justify-center gap-2"
 >
 <Trash2 size={14} /> Réinitialiser toutes les données
 </button>
 </div>
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

 <div className="h-8" />
 </div>
 );
});
ProfileTab.displayName = "ProfileTab";
