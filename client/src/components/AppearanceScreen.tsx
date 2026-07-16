import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Moon, Sun, Palette, Sparkles, Image, Wand2,
  RotateCcw, Check, Eye,
} from "lucide-react";
import { useThemeContext, COLOR_PALETTE_OPTIONS } from "@/contexts/ThemeContext";
import { THEMES } from "@/themes/definitions";
import {
  GRADIENT_DEFINITIONS, GRADIENT_CATEGORIES,
} from "@/themes/gradients";
import {
  BACKGROUND_DEFINITIONS, BACKGROUND_CATEGORIES,
} from "@/themes/backgrounds";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };
const smooth = { duration: 0.3, ease: [0.23, 1, 0.32, 1] as const };

interface AppearanceScreenProps {
  onBack: () => void;
}

const QUICK_PRESETS = [
  { id: "midnight", name: "Minuit", emoji: "🌙", themeId: "noir", palette: "violet" as const, gradientBgId: "", backgroundId: "pur" },
  { id: "ocean-breeze", name: "Brise marine", emoji: "🌊", themeId: "bleu-ocean", palette: "cyan" as const, gradientBgId: "", backgroundId: "pur" },
  { id: "forest-calm", name: "Forêt", emoji: "🌿", themeId: "vert-sauge", palette: "emerald" as const, gradientBgId: "", backgroundId: "pur" },
  { id: "sunset-glow", name: "Coucher", emoji: "🌅", themeId: "corail", palette: "orange" as const, gradientBgId: "", backgroundId: "pur" },
  { id: "aurora", name: "Aurore boréale", emoji: "✨", themeId: "blanc", palette: "violet" as const, gradientBgId: "", backgroundId: "pur" },
  { id: "royal", name: "Royal", emoji: "👑", themeId: "doré", palette: "amber" as const, gradientBgId: "", backgroundId: "pur" },
];

export default function AppearanceScreen({ onBack }: AppearanceScreenProps) {
  const {
    theme, toggleTheme,
    themeId, setThemeId,
    gradientBgId, setGradientBgId,
    backgroundId, setBackgroundId,
    borderRadius, setBorderRadius,
    shadowIntensity, setShadowIntensity,
    transparency, setTransparency,
    glassmorphism, setGlassmorphism,
    cardBlur, setCardBlur,
    fontScale, setFontScale,
    iconScale, setIconScale,
    animationSpeed, setAnimationSpeed,
    cardSize, setCardSize,
    palette, setPalette,
    resetPreferences,
  } = useThemeContext();

  const [previewMode, setPreviewMode] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeGradientCategory, setActiveGradientCategory] = useState<string>("classic");
  const [activeBackgroundCategory, setActiveBackgroundCategory] = useState<string>("solid");

  const currentTheme = useMemo(
    () => THEMES.find((t) => t.id === themeId),
    [themeId],
  );

  const filteredGradients = useMemo(
    () => GRADIENT_DEFINITIONS.filter((g) => g.category === activeGradientCategory),
    [activeGradientCategory],
  );

  const filteredBackgrounds = useMemo(
    () => BACKGROUND_DEFINITIONS.filter((b) => b.category === activeBackgroundCategory),
    [activeBackgroundCategory],
  );

  const themesByCategory = useMemo(() => {
    const map: Record<string, typeof THEMES> = {};
    THEMES.forEach((t) => {
      if (!map[t.category]) map[t.category] = [];
      map[t.category].push(t);
    });
    return map;
  }, []);

  const categoryLabels: Record<string, { label: string; icon: string }> = {
    classic: { label: "Classiques", icon: "🎨" },
    premium: { label: "Premium", icon: "✨" },
  };

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={`w-[52px] h-[30px] rounded-full transition-colors duration-300 relative flex-shrink-0 ${
        enabled ? "bg-primary" : "bg-secondary"
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 23 : 3 }}
        transition={spring}
        className="absolute top-[3px] w-[24px] h-[24px] rounded-full bg-white shadow-md"
      />
    </motion.button>
  );

  const SectionHeader = ({ icon: Icon, title, badge }: { icon: any; title: string; badge?: string }) => (
    <div className="flex items-center gap-2.5 mb-3">
      <Icon size={15} className="text-primary opacity-70" />
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
      {badge && (
        <span className="ml-auto px-2 py-[2px] rounded-full bg-primary/10 text-primary text-[9px] font-bold border border-primary/20">
          {badge}
        </span>
      )}
    </div>
  );

  const SliderRow = ({ label, value, displayValue, min, max, step, onChange, leftLabel, rightLabel }: {
    label: string; value: number; displayValue: string; min: number; max: number; step: number;
    onChange: (v: number) => void; leftLabel?: string; rightLabel?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium">{label}</p>
        <span className="text-[11px] font-bold text-primary tabular-nums">{displayValue}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-[6px] rounded-full appearance-none bg-secondary cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:shadow-primary/30 [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:active:scale-110"
      />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-[9px] text-muted-foreground font-medium">
          <span>{leftLabel}</span><span>{rightLabel}</span>
        </div>
      )}
    </div>
  );

  const SectionCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <motion.div layout transition={smooth} className={`glass-card-enhanced rounded-[1.25rem] p-4 ${className}`}>
      {children}
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide overscroll-contain"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="max-w-md mx-auto px-4 pt-10 pb-24 space-y-3.5">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 mb-1">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-card/40 border border-border/50 flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </motion.button>
          <h1 className="text-[22px] font-bold tracking-tight flex-1">Apparence</h1>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setPreviewMode(!previewMode)}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 ${
              previewMode ? "bg-primary text-primary-foreground border-primary" : "bg-card/40 border-border/50"
            }`}
          >
            <Eye size={16} />
          </motion.button>
        </div>

        {/* ── Mode d'affichage ────────────────────────────────── */}
        <SectionCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center">
                {theme === "dark" ? <Moon size={18} className="text-blue-400" /> : <Sun size={18} className="text-amber-400" />}
              </div>
              <div>
                <p className="text-[13px] font-semibold">Mode {theme === "dark" ? "sombre" : "clair"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Basculer le thème d'affichage</p>
              </div>
            </div>
            <Toggle enabled={theme === "dark"} onToggle={toggleTheme} />
          </div>
        </SectionCard>

        {/* ── Presets rapides ─────────────────────────────────── */}
        <SectionCard>
          <SectionHeader icon={Sparkles} title="Presets rapides" />
          <div className="grid grid-cols-3 gap-2">
            {QUICK_PRESETS.map((preset) => (
              <motion.button
                key={preset.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => {
                  setThemeId(preset.themeId);
                  setPalette(preset.palette);
                  setGradientBgId(preset.gradientBgId);
                  setBackgroundId(preset.backgroundId);
                }}
                className="py-2.5 rounded-[14px] text-[11px] font-semibold transition-all border bg-card/30 border-border/50 text-muted-foreground hover:bg-card/50"
              >
                <span className="text-sm">{preset.emoji}</span>
                <span className="block mt-0.5">{preset.name}</span>
              </motion.button>
            ))}
          </div>
        </SectionCard>

        {/* ── Palette de couleurs ─────────────────────────────── */}
        <SectionCard>
          <SectionHeader icon={Palette} title="Palette de couleurs" />
          <div className="grid grid-cols-5 gap-3">
            {COLOR_PALETTE_OPTIONS.map((p) => (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.88 }}
                onClick={() => setPalette(p.id)}
                className="flex flex-col items-center gap-1.5"
              >
                <div className={`relative w-9 h-9 rounded-full transition-all duration-200 ${
                  palette === p.id
                    ? "scale-110"
                    : "hover:scale-105"
                }`}
                  style={{ 
                    backgroundColor: p.color,
                    boxShadow: palette === p.id ? `0 0 0 3px var(--background), 0 0 0 5px ${p.color}` : undefined,
                  }}
                >
                  <AnimatePresence>
                    {palette === p.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={spring}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <Check size={14} className="text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-[8px] font-medium text-muted-foreground">{p.label}</span>
              </motion.button>
            ))}
          </div>
        </SectionCard>

        {/* ── Bibliothèque de thèmes ──────────────────────────── */}
        <SectionCard>
          <SectionHeader icon={Palette} title="Bibliothèque de thèmes" badge={`${THEMES.length}`} />

          {Object.entries(themesByCategory).map(([category, themes]) => {
            const meta = categoryLabels[category] || { label: category, icon: "🎨" };
            return (
              <div key={category} className="mb-3 last:mb-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-1">
                  <span className="mr-1">{meta.icon}</span>{meta.label}
                </p>
                <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-0.5 px-0.5 scrollbar-hide"
                  style={{ scrollSnapType: "x proximity", WebkitOverflowScrolling: "touch" }}>
                  {themes.map((t) => (
                    <motion.button
                      key={t.id}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setThemeId(t.id)}
                      className="flex flex-col items-center gap-1.5 shrink-0 scroll-snap-start"
                    >
                      <div
                        className={`relative w-[58px] h-[58px] rounded-[18px] border-[2.5px] transition-all duration-200 ${
                          themeId === t.id
                            ? "border-primary shadow-lg shadow-primary/25 scale-105"
                            : "border-border/60"
                        }`}
                        style={{ backgroundColor: t.preview }}
                      >
                        <AnimatePresence>
                          {themeId === t.id && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={spring}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
                                <Check size={12} className="text-primary-foreground" strokeWidth={3} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <span className="text-[9px] font-medium text-muted-foreground whitespace-nowrap">{t.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })}

          {currentTheme && (
            <div className="mt-2 pt-2 border-t border-border/40">
              <p className="text-[10px] text-muted-foreground text-center font-medium">
                Thème actuel : <span className="text-primary font-bold">{currentTheme.emoji} {currentTheme.name}</span>
              </p>
            </div>
          )}
        </SectionCard>

        {/* ── Dégradés d'arrière-plan ─────────────────────────── */}
        <SectionCard>
          <SectionHeader icon={Sparkles} title="Dégradés" />

          <div className="flex gap-1.5 overflow-x-auto pb-2.5 -mx-0.5 px-0.5 scrollbar-hide"
            style={{ scrollSnapType: "x proximity", WebkitOverflowScrolling: "touch" }}>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setGradientBgId("")}
              className={`shrink-0 px-3 py-[7px] rounded-full text-[10px] font-semibold transition-all border ${
                gradientBgId === ""
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card/30 border-border/50 text-muted-foreground"
              }`}
            >
              ✕ Aucun
            </motion.button>
            {GRADIENT_CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => setActiveGradientCategory(cat.id)}
                className={`shrink-0 px-3 py-[7px] rounded-full text-[10px] font-semibold transition-all border ${
                  activeGradientCategory === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card/30 border-border/50 text-muted-foreground"
                }`}
              >
                {cat.emoji} {cat.label}
              </motion.button>
            ))}
          </div>

          <div className="grid grid-cols-6 gap-2">
            {filteredGradients.map((g) => (
              <motion.button
                key={g.id}
                whileTap={{ scale: 0.88 }}
                onClick={() => setGradientBgId(g.id)}
                className={`relative w-full aspect-square rounded-[14px] border-[2.5px] overflow-hidden transition-all duration-200 ${
                  gradientBgId === g.id ? "border-primary shadow-lg shadow-primary/25 scale-105" : "border-border/60"
                }`}
                style={{ background: g.cssLight }}
              >
                <AnimatePresence>
                  {gradientBgId === g.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={spring}
                      className="absolute inset-0 flex items-center justify-center bg-black/25"
                    >
                      <Check size={11} className="text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <span className="absolute bottom-0 inset-x-0 text-[7px] font-bold text-white/90 bg-black/30 backdrop-blur-sm py-[2px] text-center truncate px-[2px]">
                  {g.name}
                </span>
              </motion.button>
            ))}
          </div>
        </SectionCard>

        {/* ── Arrière-plan ────────────────────────────────────── */}
        <SectionCard>
          <SectionHeader icon={Image} title="Arrière-plan" />

          <div className="flex gap-1.5 overflow-x-auto pb-2.5 -mx-0.5 px-0.5 scrollbar-hide"
            style={{ scrollSnapType: "x proximity", WebkitOverflowScrolling: "touch" }}>
            {BACKGROUND_CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => setActiveBackgroundCategory(cat.id)}
                className={`shrink-0 px-3 py-[7px] rounded-full text-[10px] font-semibold transition-all border ${
                  activeBackgroundCategory === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card/30 border-border/50 text-muted-foreground"
                }`}
              >
                {cat.emoji} {cat.label}
              </motion.button>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {filteredBackgrounds.map((bg) => (
              <motion.button
                key={bg.id}
                whileTap={{ scale: 0.88 }}
                onClick={() => setBackgroundId(bg.id)}
                className={`relative w-full aspect-square rounded-[14px] border-[2.5px] overflow-hidden transition-all duration-200 ${
                  backgroundId === bg.id ? "border-primary shadow-lg shadow-primary/25 scale-105" : "border-border/60"
                }`}
                style={{
                  background: bg.category === "solid" ? bg.preview : bg.cssLight,
                }}
              >
                <AnimatePresence>
                  {backgroundId === bg.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={spring}
                      className="absolute inset-0 flex items-center justify-center bg-black/25"
                    >
                      <Check size={11} className="text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>
                {bg.isAnimated && backgroundId !== bg.id && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                )}
                <span className="absolute bottom-0 inset-x-0 text-[7px] font-bold text-white/90 bg-black/30 backdrop-blur-sm py-[2px] text-center truncate px-[2px]">
                  {bg.name}
                </span>
              </motion.button>
            ))}
          </div>
        </SectionCard>

        {/* ── Personnalisation ─────────────────────────────────── */}
        <SectionCard className="space-y-4">
          <SectionHeader icon={Wand2} title="Personnalisation" />

          <SliderRow label="Arrondi des coins" value={borderRadius} displayValue={`${borderRadius.toFixed(1)}rem`}
            min={0.5} max={2.0} step={0.1} onChange={setBorderRadius} leftLabel="Sharp" rightLabel="Pill" />

          <div className="h-px bg-border/30" />

          <SliderRow label="Ombres" value={shadowIntensity} displayValue={`${Math.round(shadowIntensity * 100)}%`}
            min={0} max={1} step={0.05} onChange={setShadowIntensity} leftLabel="Aucune" rightLabel="Forte" />

          <div className="h-px bg-border/30" />

          <SliderRow label="Transparence" value={transparency} displayValue={`${Math.round(transparency * 100)}%`}
            min={0} max={1} step={0.05} onChange={setTransparency} leftLabel="Opaque" rightLabel="Translucide" />

          <div className="h-px bg-border/30" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium">Glassmorphism</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Effet vitre sur les cartes</p>
            </div>
            <Toggle enabled={glassmorphism} onToggle={() => setGlassmorphism(!glassmorphism)} />
          </div>

          <div className="h-px bg-border/30" />

          <SliderRow label="Flou des cartes" value={cardBlur} displayValue={`${cardBlur}px`}
            min={0} max={64} step={4} onChange={setCardBlur} leftLabel="Net" rightLabel="Flou total" />

          <div className="h-px bg-border/30" />

          <SliderRow label="Taille du texte" value={fontScale} displayValue={`${Math.round(fontScale * 100)}%`}
            min={0.8} max={1.2} step={0.05} onChange={setFontScale} leftLabel="Petit" rightLabel="Grand" />

          <div className="h-px bg-border/30" />

          <SliderRow label="Taille des icônes" value={iconScale} displayValue={`${Math.round(iconScale * 100)}%`}
            min={0.8} max={1.5} step={0.05} onChange={setIconScale} leftLabel="Petit" rightLabel="Grand" />
        </SectionCard>

        {/* ── Animations ──────────────────────────────────────── */}
        <SectionCard>
          <SectionHeader icon={Sparkles} title="Animations" />
          <div className="grid grid-cols-4 gap-2">
            {([
              { id: "standard" as const, label: "Standard", icon: "⚡" },
              { id: "smooth" as const, label: "Fluide", icon: "🌊" },
              { id: "fast" as const, label: "Rapide", icon: "💨" },
              { id: "disabled" as const, label: "Arrêt", icon: "⏸" },
            ]).map((opt) => (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => setAnimationSpeed(opt.id)}
                className={`py-2.5 rounded-[14px] text-[11px] font-semibold transition-all border ${
                  animationSpeed === opt.id
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "bg-card/30 border-border/50 text-muted-foreground"
                }`}
              >
                <span className="text-sm">{opt.icon}</span>
                <span className="block mt-0.5">{opt.label}</span>
              </motion.button>
            ))}
          </div>
        </SectionCard>

        {/* ── Taille des cartes ───────────────────────────────── */}
        <SectionCard>
          <SectionHeader icon={Palette} title="Taille des cartes" />
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: "compact" as const, label: "Compact", icon: "▪️" },
              { id: "normal" as const, label: "Normal", icon: "◻️" },
              { id: "spacious" as const, label: "Spacieux", icon: "⬜" },
            ]).map((opt) => (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => setCardSize(opt.id)}
                className={`py-2.5 rounded-[14px] text-[11px] font-semibold transition-all border ${
                  cardSize === opt.id
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "bg-card/30 border-border/50 text-muted-foreground"
                }`}
              >
                <span className="text-sm">{opt.icon}</span>
                <span className="block mt-0.5">{opt.label}</span>
              </motion.button>
            ))}
          </div>
        </SectionCard>

        {/* ── Aperçu en direct ────────────────────────────────── */}
        <SectionCard>
          <SectionHeader icon={Eye} title="Aperçu en direct" />
          <motion.div layout transition={spring} className="rounded-[16px] overflow-hidden border border-border/40 shadow-lg"
            style={{ borderRadius: `${borderRadius}rem` }}>
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between" 
              style={{ backgroundColor: currentTheme ? (theme === "dark" ? currentTheme.dark.primary : currentTheme.light.primary) : "var(--primary)" }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs">🍽️</div>
                <span className="text-[12px] font-bold text-white" style={{ fontSize: `${fontScale * 12}px` }}>Équilibra</span>
              </div>
              <span className="text-[10px] text-white/80">Aujourd'hui</span>
            </div>
            {/* Card body */}
            <div className="p-3 space-y-2.5" style={{ 
              backgroundColor: currentTheme ? (theme === "dark" ? currentTheme.dark.card : currentTheme.light.card) : "var(--card)",
              padding: `calc(${cardSize === "compact" ? "0.5rem" : cardSize === "spacious" ? "1rem" : "0.75rem"} + 0.25rem)`
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm"
                    style={{ transform: `scale(${iconScale})` }}>🧑</div>
                  <div>
                    <p className="text-[12px] font-semibold" style={{ fontSize: `${fontScale * 12}px`, color: currentTheme ? (theme === "dark" ? currentTheme.dark.foreground : currentTheme.light.foreground) : undefined }}>Restaurant</p>
                    <p className="text-[9px]" style={{ fontSize: `${fontScale * 9}px`, color: currentTheme ? (theme === "dark" ? currentTheme.dark.mutedForeground : currentTheme.light.mutedForeground) : undefined }}>Payé par Mohammed</p>
                  </div>
                </div>
                <p className="text-[13px] font-bold tabular-nums" style={{ fontSize: `${fontScale * 13}px`, color: currentTheme ? (theme === "dark" ? currentTheme.dark.primary : currentTheme.light.primary) : "var(--primary)" }}>45.00 MAD</p>
              </div>
              <div className="flex gap-1.5">
                <div className="flex-1 py-1.5 rounded-lg text-center text-[10px] font-semibold" style={{ 
                  backgroundColor: currentTheme ? (theme === "dark" ? currentTheme.dark.primary + "20" : currentTheme.light.primary + "20") : "var(--primary)",
                  color: currentTheme ? (theme === "dark" ? currentTheme.dark.primary : currentTheme.light.primary) : "var(--primary)"
                }}>J'ai payé</div>
                <div className="flex-1 py-1.5 rounded-lg text-center text-[10px] font-semibold" style={{ 
                  backgroundColor: currentTheme ? (theme === "dark" ? currentTheme.dark.destructive + "15" : currentTheme.light.destructive + "15") : undefined,
                  color: currentTheme ? (theme === "dark" ? currentTheme.dark.destructive : currentTheme.light.destructive) : "var(--destructive)"
                }}>Refuser</div>
              </div>
            </div>
          </motion.div>
        </SectionCard>

        {/* ── Reset ───────────────────────────────────────────── */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowResetConfirm(true)}
          className="w-full py-3 rounded-[14px] bg-card/30 border border-border/50 text-[13px] font-semibold text-muted-foreground flex items-center justify-center gap-2 transition-colors active:bg-card/50"
        >
          <RotateCcw size={14} />
          Réinitialiser l'apparence
        </motion.button>

        <AnimatePresence>
          {showResetConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6"
              onClick={() => setShowResetConfirm(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                transition={spring} onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-[1.25rem] p-6 w-full max-w-sm shadow-xl">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
                    <RotateCcw size={20} className="text-orange-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">Réinitialiser ?</h3>
                  <p className="text-sm text-muted-foreground">Toutes vos préférences d'apparence seront remises par défaut.</p>
                </div>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-colors">
                    Annuler
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => { resetPreferences(); setShowResetConfirm(false); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors">
                    Réinitialiser
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-4" />
      </div>
    </motion.div>
  );
}
