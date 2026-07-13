import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Moon, Sun, Palette, Bell, Globe, DollarSign, Lock, Eye, EyeOff,
  Trash2, ChevronRight, Check, Zap, CloudOff, Shield, RotateCcw, Clock, Fingerprint,
  X, AlertTriangle,
} from "lucide-react";
import {
  useThemeContext, COLOR_PALETTE_OPTIONS, GRADIENT_OPTIONS, BACKGROUND_OPTIONS,
} from "@/contexts/ThemeContext";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

interface SettingsScreenProps {
  onBack: () => void;
  monthlyBudget: number;
  onSetBudget: (v: number) => void;
  currency: string;
  onSetCurrency: (c: string) => void;
  autoReminders: boolean;
  onToggleReminders: () => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  offlineMode: boolean;
  onToggleOffline: () => void;
  pushNotifications: boolean;
  onTogglePushNotifications: () => void;
  reminderDelay: number;
  onSetReminderDelay: (d: number) => void;
  onClearData: () => void;
  biometricEnabled: boolean;
  onToggleBiometric: () => void;
}

export function SettingsScreen({
  onBack, monthlyBudget, onSetBudget, currency, onSetCurrency,
  autoReminders, onToggleReminders, privacyMode, onTogglePrivacy,
  offlineMode, onToggleOffline, pushNotifications, onTogglePushNotifications,
  reminderDelay, onSetReminderDelay, onClearData,
  biometricEnabled, onToggleBiometric,
}: SettingsScreenProps) {
  const {
    theme, toggleTheme, palette, setPalette, gradient, setGradient,
    background, setBackground, borderRadius, setBorderRadius,
    cardBlur, setCardBlur, fontScale, setFontScale, resetPreferences,
  } = useThemeContext();

  const [section, setSection] = useState<"main" | "appearance" | "colors" | "budget" | "notifications" | "privacy">("main");
  const [showDelayPicker, setShowDelayPicker] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fadeSlide = { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -30 } };

  const SectionHeader = ({ icon: Icon, title, color }: { icon: any; title: string; color?: string }) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center border border-border" style={{ backgroundColor: color ? `${color}15` : "hsl(var(--primary) / 10%)" }}>
        <Icon size={20} style={{ color: color || "hsl(var(--primary))" }} />
      </div>
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
    </div>
  );

  const SettingRow = ({ icon: Icon, label, description, action, onClick }: { icon: any; label: string; description?: string; action?: React.ReactNode; onClick?: () => void }) => (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onClick}
      className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card/30 border border-border active:bg-card/50 transition-colors text-left">
      <div className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action || (onClick && <ChevronRight size={16} className="text-muted-foreground/50" />)}
    </motion.button>
  );

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <motion.button whileTap={{ scale: 0.95 }} onClick={onToggle}
      className={`w-[52px] h-8 rounded-full transition-all duration-300 relative ${enabled ? "bg-primary shadow-lg shadow-primary/30" : "bg-secondary"}`}>
      <motion.div animate={{ x: enabled ? 22 : 3 }} transition={spring}
        className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md" />
    </motion.button>
  );

  const AppearanceSection = () => (
    <motion.div {...fadeSlide} className="space-y-6">
      <SectionHeader icon={Palette} title="Apparence" color="#a78bfa" />

      <div className="glass-card-enhanced rounded-[1.5rem] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon size={20} className="text-blue-400" /> : <Sun size={20} className="text-amber-400" />}
            <div>
              <p className="text-sm font-semibold">Mode {theme === "dark" ? "sombre" : "clair"}</p>
              <p className="text-[11px] text-muted-foreground">Basculer le thème</p>
            </div>
          </div>
          <Toggle enabled={theme === "dark"} onToggle={toggleTheme} />
        </div>

        <div className="h-px bg-muted/30" />

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Couleur principale</p>
          <div className="grid grid-cols-5 gap-2">
            {COLOR_PALETTE_OPTIONS.map(c => (
              <motion.button key={c.id} whileTap={{ scale: 0.9 }} onClick={() => setPalette(c.id)}
                className={`relative w-full aspect-square rounded-2xl border-2 transition-all ${palette === c.id ? "border-primary scale-105 shadow-lg" : "border-transparent"}`}
                style={{ backgroundColor: c.color }}>
                {palette === c.id && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center">
                    <Check size={16} className="text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="h-px bg-muted/30" />

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dégradé d'arrière-plan</p>
          <div className="grid grid-cols-5 gap-2">
            {GRADIENT_OPTIONS.map(g => (
              <motion.button key={g.id} whileTap={{ scale: 0.9 }} onClick={() => setGradient(g.id)}
                className={`relative w-full aspect-square rounded-2xl border-2 overflow-hidden transition-all ${gradient === g.id ? "border-primary scale-105 shadow-lg" : "border-transparent"}`}
                style={{ background: g.id === "none" ? "hsl(var(--muted))" : g.preview }}>
                {gradient === g.id && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </motion.div>
                )}
                <span className="absolute bottom-0 inset-x-0 text-[8px] font-bold text-white bg-black/40 py-0.5 text-center">{g.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="h-px bg-muted/30" />

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Motif d'arrière-plan</p>
          <div className="flex gap-2">
            {BACKGROUND_OPTIONS.map(b => (
              <motion.button key={b.id} whileTap={{ scale: 0.95 }} onClick={() => setBackground(b.id)}
                className={`flex-1 py-3 rounded-2xl text-xs font-semibold transition-all border flex flex-col items-center gap-1.5 ${background === b.id ? "bg-primary text-primary-foreground border-primary" : "bg-card/30 border-border text-muted-foreground"}`}>
                <span className="text-lg">{b.icon}</span>
                {b.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card-enhanced rounded-[1.5rem] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Arrondi des coins</p>
          <span className="text-xs font-bold text-primary">{borderRadius.toFixed(1)}rem</span>
        </div>
        <input type="range" min="0.5" max="2" step="0.1" value={borderRadius}
          onChange={e => setBorderRadius(parseFloat(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-secondary" />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Sharp</span><span>Rond</span><span>Pill</span>
        </div>
      </div>

      <div className="glass-card-enhanced rounded-[1.5rem] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Flou des cartes</p>
          <span className="text-xs font-bold text-primary">{cardBlur}px</span>
        </div>
        <input type="range" min="0" max="64" step="4" value={cardBlur}
          onChange={e => setCardBlur(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-secondary" />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Net</span><span>Verre dépoli</span><span>Flou total</span>
        </div>
      </div>

      <div className="glass-card-enhanced rounded-[1.5rem] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Taille du texte</p>
          <span className="text-xs font-bold text-primary">{(fontScale * 100).toFixed(0)}%</span>
        </div>
        <input type="range" min="0.8" max="1.2" step="0.05" value={fontScale}
          onChange={e => setFontScale(parseFloat(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-secondary" />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Petit</span><span>Normal</span><span>Grand</span>
        </div>
      </div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={resetPreferences}
        className="w-full py-3.5 rounded-2xl bg-card/30 border border-border text-sm font-semibold text-muted-foreground flex items-center justify-center gap-2">
        <RotateCcw size={16} />
        Réinitialiser l'apparence
      </motion.button>
    </motion.div>
  );

  const BudgetSection = () => {
    const [budgetInput, setBudgetInput] = useState(monthlyBudget.toString());
    return (
      <motion.div {...fadeSlide} className="space-y-6">
        <SectionHeader icon={DollarSign} title="Budget & Devise" color="#fbbf24" />
        <div className="glass-card-enhanced rounded-[1.5rem] p-5 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Budget mensuel du groupe</p>
          <div className="relative">
            <input type="number" inputMode="decimal" value={budgetInput} onChange={e => setBudgetInput(e.target.value)}
              className="w-full bg-card/30 border border-border rounded-2xl px-5 py-4 text-3xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{currency}</span>
          </div>
          <div className="flex gap-2">
            {[500, 1000, 2000, 5000].map(v => (
              <motion.button key={v} whileTap={{ scale: 0.95 }} onClick={() => setBudgetInput(v.toString())}
                className="flex-1 py-2.5 rounded-xl bg-secondary/50 text-xs font-semibold hover:bg-secondary/70 transition-colors">
                {v.toLocaleString()}
              </motion.button>
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => onSetBudget(parseFloat(budgetInput) || 0)}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold">
            Sauvegarder
          </motion.button>
        </div>

        <div className="glass-card-enhanced rounded-[1.5rem] p-5 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Devise</p>
          <div className="grid grid-cols-3 gap-2">
            {[{ code: "MAD", label: "Dirham (MAD)", flag: "🇲🇦" }, { code: "EUR", label: "Euro (EUR)", flag: "🇪🇺" }, { code: "USD", label: "Dollar (USD)", flag: "🇺🇸" }].map(c => (
              <motion.button key={c.code} whileTap={{ scale: 0.95 }} onClick={() => onSetCurrency(c.code)}
                className={`py-3 rounded-2xl text-sm font-bold transition-all border flex flex-col items-center gap-1 ${currency === c.code ? "bg-primary text-primary-foreground border-primary" : "bg-card/30 border-border text-muted-foreground"}`}>
                <span className="text-lg">{c.flag}</span>
                {c.code}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  const NotificationsSection = () => (
    <motion.div {...fadeSlide} className="space-y-6">
      <SectionHeader icon={Bell} title="Notifications" color="#f472b6" />
      <div className="glass-card-enhanced rounded-[1.5rem] p-5 space-y-4">
        <SettingRow icon={Bell} label="Notifications push" description="Recevoir des alertes même hors de l'app"
          action={<Toggle enabled={pushNotifications} onToggle={onTogglePushNotifications} />} />
        <div className="h-px bg-muted/30" />
        <SettingRow icon={Zap} label="Rappels automatiques" description="Rappeler les membres en retard"
          action={<Toggle enabled={autoReminders} onToggle={onToggleReminders} />} />
        <div className="h-px bg-muted/30" />
        <SettingRow icon={Clock} label="Délai de rappel" description={`${reminderDelay} jour${reminderDelay > 1 ? 's' : ''} après l'échéance`}
          onClick={() => setShowDelayPicker(true)} />
      </div>

      {/* Reminder Delay Picker Modal */}
      <AnimatePresence>
        {showDelayPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[100] px-4 pb-8"
            onClick={() => setShowDelayPicker(false)}>
            <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-card border border-border rounded-[1.5rem] p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold">Délai de rappel</h3>
                <button onClick={() => setShowDelayPicker(false)} className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 5, 7].map(d => (
                  <motion.button key={d} whileTap={{ scale: 0.98 }}
                    onClick={() => { onSetReminderDelay(d); setShowDelayPicker(false); }}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-between transition-colors ${reminderDelay === d ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted/30 text-foreground"}`}>
                    <span>{d} jour{d > 1 ? 's' : ''}</span>
                    {reminderDelay === d && <Check size={16} className="text-primary" />}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const PrivacySection = () => (
    <motion.div {...fadeSlide} className="space-y-6">
      <SectionHeader icon={Shield} title="Confidentialité" color="#10b981" />
      <div className="glass-card-enhanced rounded-[1.5rem] p-5 space-y-4">
        <SettingRow icon={EyeOff} label="Mode privé" description="Masquer les montants des autres"
          action={<Toggle enabled={privacyMode} onToggle={onTogglePrivacy} />} />
        <div className="h-px bg-muted/30" />
        <SettingRow icon={CloudOff} label="Mode hors-ligne" description="Fonctionner sans connexion"
          action={<Toggle enabled={offlineMode} onToggle={onToggleOffline} />} />
        <div className="h-px bg-muted/30" />
        <SettingRow icon={Fingerprint} label="Verrouillage biométrique" description="Face ID / Touch ID"
          action={<Toggle enabled={biometricEnabled} onToggle={onToggleBiometric} />} />
        <div className="h-px bg-muted/30" />
        <SettingRow icon={Trash2} label="Effacer les données locales" description="Réinitialiser tout"
          onClick={() => setShowClearConfirm(true)} />
      </div>

      {/* Clear Data Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-6"
            onClick={() => setShowClearConfirm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-[1.5rem] p-6 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-center">Effacer les données ?</h3>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Cette action est irréversible. Toutes les données locales seront supprimées.
              </p>
              <div className="flex gap-2 mt-5">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 rounded-2xl bg-muted/30 text-sm font-semibold border border-border">
                  Annuler
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={onClearData}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-semibold">
                  Effacer
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const MainSection = () => (
    <motion.div {...fadeSlide} className="space-y-3">
      <SettingRow icon={Palette} label="Apparence" description="Couleurs, thème, dégradés" onClick={() => setSection("appearance")} />
      <SettingRow icon={DollarSign} label="Budget & Devise" description="Budget mensuel, MAD/EUR/USD" onClick={() => setSection("budget")} />
      <SettingRow icon={Bell} label="Notifications" description="Push, rappels automatiques" onClick={() => setSection("notifications")} />
      <SettingRow icon={Shield} label="Confidentialité & Sécurité" description="Hors-ligne, données" onClick={() => setSection("privacy")} />
    </motion.div>
  );

  const titles: Record<string, string> = {
    main: "Paramètres",
    appearance: "Apparence",
    budget: "Budget & Devise",
    notifications: "Notifications",
    privacy: "Confidentialité",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto px-5 pt-12 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <motion.button whileTap={{ scale: 0.9 }} onClick={section !== "main" ? () => setSection("main") : onBack}
          className="w-10 h-10 rounded-2xl bg-card/30 border border-border flex items-center justify-center">
          <ArrowLeft size={20} />
        </motion.button>
        <h1 className="text-3xl font-bold tracking-tight">{titles[section]}</h1>
      </div>

      <AnimatePresence mode="wait">
        {section === "main" && <MainSection key="main" />}
        {section === "appearance" && <AppearanceSection key="appearance" />}
        {section === "budget" && <BudgetSection key="budget" />}
        {section === "notifications" && <NotificationsSection key="notifications" />}
        {section === "privacy" && <PrivacySection key="privacy" />}
      </AnimatePresence>

      <div className="h-8" />
    </motion.div>
  );
}
