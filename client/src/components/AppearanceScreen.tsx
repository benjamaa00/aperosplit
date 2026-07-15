import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Moon, Sun, Palette, Sparkles, Image, Wand2,
  RotateCcw, Check, Eye,
} from "lucide-react";
import { useThemeContext } from "@/contexts/ThemeContext";
import { THEMES } from "@/themes/definitions";
import {
  GRADIENT_DEFINITIONS, GRADIENT_CATEGORIES,
} from "@/themes/gradients";
import {
  BACKGROUND_DEFINITIONS, BACKGROUND_CATEGORIES,
} from "@/themes/backgrounds";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

interface AppearanceScreenProps {
  onBack: () => void;
}

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
    resetPreferences,
  } = useThemeContext();

  const [previewMode, setPreviewMode] = useState(false);
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

  const Toggle = ({
    enabled,
    onToggle,
  }: {
    enabled: boolean;
    onToggle: () => void;
  }) => (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={`w-[52px] h-8 rounded-full transition-all duration-300 relative ${
        enabled
          ? "bg-primary shadow-lg shadow-primary/30"
          : "bg-secondary"
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 22 : 3 }}
        transition={spring}
        className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md"
      />
    </motion.button>
  );

  const SectionHeader = ({
    icon: Icon,
    title,
    badge,
  }: {
    icon: any;
    title: string;
    badge?: string;
  }) => (
    <div className="flex items-center gap-3 mb-3">
      <Icon size={16} className="text-primary" />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </p>
      {badge && (
        <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
          {badge}
        </span>
      )}
    </div>
  );

  const SliderRow = ({
    label,
    value,
    displayValue,
    min,
    max,
    step,
    onChange,
    leftLabel,
    rightLabel,
  }: {
    label: string;
    value: number;
    displayValue: string;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
    leftLabel?: string;
    rightLabel?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{label}</p>
        <span className="text-xs font-bold text-primary">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-secondary"
      />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto px-5 pt-12 space-y-5"
    >
      {/* ── 1. Header ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-10 h-10 rounded-2xl bg-card/30 border border-border flex items-center justify-center"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <h1 className="text-3xl font-bold tracking-tight flex-1">
          Apparence & Thèmes
        </h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setPreviewMode(!previewMode)}
          className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all ${
            previewMode
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card/30 border-border"
          }`}
        >
          <Eye size={18} />
        </motion.button>
      </div>

      {/* ── 2. Mode d'affichage ─────────────────────────────── */}
      <div className="glass-card-enhanced rounded-[1.5rem] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "dark" ? (
              <Moon size={20} className="text-blue-400" />
            ) : (
              <Sun size={20} className="text-amber-400" />
            )}
            <div>
              <p className="text-sm font-semibold">
                Mode {theme === "dark" ? "sombre" : "clair"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Basculer le thème d'affichage
              </p>
            </div>
          </div>
          <Toggle enabled={theme === "dark"} onToggle={toggleTheme} />
        </div>
      </div>

      {/* ── 3. Bibliothèque de thèmes ───────────────────────── */}
      <div className="glass-card-enhanced rounded-[1.5rem] p-5">
        <SectionHeader icon={Palette} title="Bibliothèque de thèmes" badge="Premium" />

        {Object.entries(themesByCategory).map(([category, themes]) => {
          const meta = categoryLabels[category] || { label: category, icon: "🎨" };
          return (
            <div key={category} className="mb-4 last:mb-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-3">
                <span className="mr-1">{meta.icon}</span>
                {meta.label}
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {themes.map((t) => (
                  <motion.button
                    key={t.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setThemeId(t.id)}
                    className="flex flex-col items-center gap-1.5 shrink-0"
                  >
                    <div
                      className={`relative w-16 h-16 rounded-2xl border-2 transition-all ${
                        themeId === t.id
                          ? "border-primary scale-105 shadow-lg shadow-primary/20"
                          : "border-border"
                      }`}
                      style={{ backgroundColor: t.preview }}
                    >
                      <AnimatePresence>
                        {themeId === t.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check
                                size={14}
                                className="text-primary-foreground"
                                strokeWidth={3}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                      {t.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          );
        })}

        {currentTheme && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Thème actuel :{" "}
              <span className="font-bold text-primary">
                {currentTheme.emoji} {currentTheme.name}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* ── 4. Dégradés d'arrière-plan ──────────────────────── */}
      <div className="glass-card-enhanced rounded-[1.5rem] p-5">
        <SectionHeader icon={Sparkles} title="Dégradés d'arrière-plan" />

        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-hide">
          {GRADIENT_CATEGORIES.map((cat) => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveGradientCategory(cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border ${
                activeGradientCategory === cat.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card/30 border-border text-muted-foreground"
              }`}
            >
              {cat.emoji} {cat.label}
            </motion.button>
          ))}
        </div>

        {/* Gradient Swatches */}
        <div className="grid grid-cols-6 gap-2">
          {/* "Aucun" option */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setGradientBgId("")}
            className={`relative w-full aspect-square rounded-2xl border-2 transition-all flex items-center justify-center ${
              gradientBgId === ""
                ? "border-primary scale-105 shadow-lg"
                : "border-border"
            }`}
            style={{ backgroundColor: "hsl(var(--muted))" }}
          >
            {gradientBgId === "" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Check size={14} className="text-primary" strokeWidth={3} />
              </motion.div>
            )}
            <span className="text-[8px] font-bold text-muted-foreground">
              Aucun
            </span>
          </motion.button>

          {filteredGradients.map((g) => (
            <motion.button
              key={g.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => setGradientBgId(g.id)}
              className={`relative w-full aspect-square rounded-2xl border-2 overflow-hidden transition-all ${
                gradientBgId === g.id
                  ? "border-primary scale-105 shadow-lg"
                  : "border-border"
              }`}
              style={{ background: g.cssLight }}
            >
              <AnimatePresence>
                {gradientBgId === g.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/20"
                  >
                    <Check
                      size={12}
                      className="text-white"
                      strokeWidth={3}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <span className="absolute bottom-0 inset-x-0 text-[7px] font-bold text-white bg-black/40 py-0.5 text-center truncate px-0.5">
                {g.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── 5. Arrière-plan ─────────────────────────────────── */}
      <div className="glass-card-enhanced rounded-[1.5rem] p-5">
        <SectionHeader icon={Image} title="Arrière-plan" />

        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-hide">
          {BACKGROUND_CATEGORIES.map((cat) => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveBackgroundCategory(cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border ${
                activeBackgroundCategory === cat.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card/30 border-border text-muted-foreground"
              }`}
            >
              {cat.emoji} {cat.label}
            </motion.button>
          ))}
        </div>

        {/* Background Swatches */}
        <div className="grid grid-cols-5 gap-2">
          {filteredBackgrounds.map((bg) => {
            const isSolid = bg.category === "solid";
            const isAnimated = bg.isAnimated;
            return (
              <motion.button
                key={bg.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => setBackgroundId(bg.id)}
                className={`relative w-full aspect-square rounded-2xl border-2 overflow-hidden transition-all ${
                  backgroundId === bg.id
                    ? "border-primary scale-105 shadow-lg"
                    : "border-border"
                }`}
                style={{
                  background: isSolid
                    ? bg.preview
                    : bg.category === "gradient" || bg.category === "animated"
                      ? bg.cssLight
                      : bg.cssLight,
                }}
              >
                <AnimatePresence>
                  {backgroundId === bg.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/20"
                    >
                      <Check
                        size={12}
                        className="text-white"
                        strokeWidth={3}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {isAnimated && backgroundId !== bg.id && (
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                )}

                <span className="absolute bottom-0 inset-x-0 text-[7px] font-bold text-white bg-black/40 py-0.5 text-center truncate px-0.5">
                  {bg.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── 6. Personnalisation ─────────────────────────────── */}
      <div className="glass-card-enhanced rounded-[1.5rem] p-5 space-y-5">
        <SectionHeader icon={Wand2} title="Personnalisation" />

        {/* a) Border radius */}
        <SliderRow
          label="Arrondi des coins"
          value={borderRadius}
          displayValue={`${borderRadius.toFixed(1)}rem`}
          min={0.5}
          max={2.0}
          step={0.1}
          onChange={setBorderRadius}
          leftLabel="Sharp"
          rightLabel="Pill"
        />

        <div className="h-px bg-muted/30" />

        {/* b) Shadow intensity */}
        <SliderRow
          label="Intensité des ombres"
          value={shadowIntensity}
          displayValue={`${Math.round(shadowIntensity * 100)}%`}
          min={0}
          max={1}
          step={0.05}
          onChange={setShadowIntensity}
          leftLabel="Aucune"
          rightLabel="Forte"
        />

        <div className="h-px bg-muted/30" />

        {/* c) Transparency */}
        <SliderRow
          label="Transparence"
          value={transparency}
          displayValue={`${Math.round(transparency * 100)}%`}
          min={0}
          max={1}
          step={0.05}
          onChange={setTransparency}
          leftLabel="Opaque"
          rightLabel="Translucide"
        />

        <div className="h-px bg-muted/30" />

        {/* d) Glassmorphism */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Glassmorphism</p>
            <p className="text-[11px] text-muted-foreground">
              Effet vitre sur les cartes
            </p>
          </div>
          <Toggle
            enabled={glassmorphism}
            onToggle={() => setGlassmorphism(!glassmorphism)}
          />
        </div>

        <div className="h-px bg-muted/30" />

        {/* e) Card blur */}
        <SliderRow
          label="Flou des cartes"
          value={cardBlur}
          displayValue={`${cardBlur}px`}
          min={0}
          max={64}
          step={4}
          onChange={setCardBlur}
          leftLabel="Net"
          rightLabel="Flou total"
        />

        <div className="h-px bg-muted/30" />

        {/* f) Font scale */}
        <SliderRow
          label="Taille du texte"
          value={fontScale}
          displayValue={`${Math.round(fontScale * 100)}%`}
          min={0.8}
          max={1.2}
          step={0.05}
          onChange={setFontScale}
          leftLabel="Petit"
          rightLabel="Grand"
        />

        <div className="h-px bg-muted/30" />

        {/* g) Icon scale */}
        <SliderRow
          label="Taille des icônes"
          value={iconScale}
          displayValue={`${Math.round(iconScale * 100)}%`}
          min={0.8}
          max={1.5}
          step={0.05}
          onChange={setIconScale}
          leftLabel="Petit"
          rightLabel="Grand"
        />
      </div>

      {/* ── 7. Animations ───────────────────────────────────── */}
      <div className="glass-card-enhanced rounded-[1.5rem] p-5">
        <SectionHeader icon={Sparkles} title="Animations" />

        <div className="grid grid-cols-4 gap-2">
          {([
            { id: "standard" as const, label: "Standard" },
            { id: "smooth" as const, label: "Fluide" },
            { id: "fast" as const, label: "Rapide" },
            { id: "disabled" as const, label: "Désactivées" },
          ]).map((opt) => (
            <motion.button
              key={opt.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setAnimationSpeed(opt.id)}
              className={`py-3 rounded-2xl text-xs font-semibold transition-all border ${
                animationSpeed === opt.id
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-card/30 border-border text-muted-foreground"
              }`}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── 8. Taille des cartes ────────────────────────────── */}
      <div className="glass-card-enhanced rounded-[1.5rem] p-5">
        <SectionHeader icon={Palette} title="Taille des cartes" />

        <div className="grid grid-cols-3 gap-2">
          {([
            { id: "compact" as const, label: "Compact" },
            { id: "normal" as const, label: "Normal" },
            { id: "spacious" as const, label: "Spacieux" },
          ]).map((opt) => (
            <motion.button
              key={opt.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCardSize(opt.id)}
              className={`py-3 rounded-2xl text-xs font-semibold transition-all border ${
                cardSize === opt.id
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-card/30 border-border text-muted-foreground"
              }`}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── 9. Live Preview ─────────────────────────────────── */}
      <div className="glass-card-enhanced rounded-[1.5rem] p-5">
        <SectionHeader icon={Eye} title="Aperçu en direct" />

        <motion.div
          layout
          transition={spring}
          className="glass-card-enhanced rounded-[1.25rem] p-4 border border-border"
          style={{
            borderRadius: `${borderRadius}rem`,
            opacity: 0.3 + transparency * 0.7,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-lg">🍽️</span>
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ fontSize: `${fontScale * 14}px` }}
                >
                  Restaurant
                </p>
                <p
                  className="text-[11px] text-muted-foreground"
                  style={{ fontSize: `${fontScale * 11}px` }}
                >
                  Payé par Mohammed
                </p>
              </div>
            </div>
            <p
              className="text-base font-bold text-primary"
              style={{ fontSize: `${fontScale * 16}px` }}
            >
              45.00 MAD
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── 10. Reset Button ────────────────────────────────── */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={resetPreferences}
        className="w-full py-3.5 rounded-2xl bg-card/30 border border-border text-sm font-semibold text-muted-foreground flex items-center justify-center gap-2"
      >
        <RotateCcw size={16} />
        Réinitialiser l'apparence
      </motion.button>

      <div className="h-8" />
    </motion.div>
  );
}
