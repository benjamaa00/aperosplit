import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

export type ColorPalette =
  | "violet" | "blue" | "emerald" | "rose" | "amber"
  | "cyan" | "orange" | "teal" | "pink" | "indigo"
  | "lime" | "red" | "sky" | "fuchsia" | "slate";

export type GradientStyle = "none" | "subtle" | "vivid" | "aurora" | "sunset" | "ocean" | "forest" | "neon" | "warm" | "cool";

export type BackgroundStyle = "solid" | "mesh" | "dots" | "waves" | "circles" | "noise";

interface ThemePreferences {
  theme: Theme;
  palette: ColorPalette;
  gradient: GradientStyle;
  background: BackgroundStyle;
  borderRadius: number; // 0.5 to 2.0 rem
  cardBlur: number; // 0 to 64 px
  fontScale: number; // 0.8 to 1.2
}

interface ThemeContextType {
  theme: Theme;
  palette: ColorPalette;
  gradient: GradientStyle;
  background: BackgroundStyle;
  borderRadius: number;
  cardBlur: number;
  fontScale: number;
  preferences: ThemePreferences;
  toggleTheme: () => void;
  setPalette: (p: ColorPalette) => void;
  setGradient: (g: GradientStyle) => void;
  setBackground: (b: BackgroundStyle) => void;
  setBorderRadius: (r: number) => void;
  setCardBlur: (b: number) => void;
  setFontScale: (s: number) => void;
  setPreferences: (prefs: Partial<ThemePreferences>) => void;
  resetPreferences: () => void;
}

const PALETTES: Record<ColorPalette, { light: Record<string, string>; dark: Record<string, string> }> = {
  violet: {
    light: { "--primary": "oklch(0.546 0.245 262.881)", "--ring": "oklch(0.546 0.245 262.881)", "--chart-1": "oklch(0.546 0.245 262.881)" },
    dark: { "--primary": "oklch(0.623 0.214 259.815)", "--ring": "oklch(0.623 0.214 259.815)", "--chart-1": "oklch(0.623 0.214 259.815)" },
  },
  blue: {
    light: { "--primary": "oklch(0.546 0.245 255)", "--ring": "oklch(0.546 0.245 255)", "--chart-1": "oklch(0.546 0.245 255)" },
    dark: { "--primary": "oklch(0.623 0.214 250)", "--ring": "oklch(0.623 0.214 250)", "--chart-1": "oklch(0.623 0.214 250)" },
  },
  emerald: {
    light: { "--primary": "oklch(0.596 0.178 163.225)", "--ring": "oklch(0.596 0.178 163.225)", "--chart-1": "oklch(0.596 0.178 163.225)" },
    dark: { "--primary": "oklch(0.696 0.17 162.48)", "--ring": "oklch(0.696 0.17 162.48)", "--chart-1": "oklch(0.696 0.17 162.48)" },
  },
  rose: {
    light: { "--primary": "oklch(0.569 0.24 354.308)", "--ring": "oklch(0.569 0.24 354.308)", "--chart-1": "oklch(0.569 0.24 354.308)" },
    dark: { "--primary": "oklch(0.645 0.246 354.308)", "--ring": "oklch(0.645 0.246 354.308)", "--chart-1": "oklch(0.645 0.246 354.308)" },
  },
  amber: {
    light: { "--primary": "oklch(0.666 0.192 58.318)", "--ring": "oklch(0.666 0.192 58.318)", "--chart-1": "oklch(0.666 0.192 58.318)" },
    dark: { "--primary": "oklch(0.769 0.188 70.08)", "--ring": "oklch(0.769 0.188 70.08)", "--chart-1": "oklch(0.769 0.188 70.08)" },
  },
  cyan: {
    light: { "--primary": "oklch(0.609 0.19 196.769)", "--ring": "oklch(0.609 0.19 196.769)", "--chart-1": "oklch(0.609 0.19 196.769)" },
    dark: { "--primary": "oklch(0.715 0.143 215.221)", "--ring": "oklch(0.715 0.143 215.221)", "--chart-1": "oklch(0.715 0.143 215.221)" },
  },
  orange: {
    light: { "--primary": "oklch(0.648 0.201 27.325)", "--ring": "oklch(0.648 0.201 27.325)", "--chart-1": "oklch(0.648 0.201 27.325)" },
    dark: { "--primary": "oklch(0.705 0.213 47.604)", "--ring": "oklch(0.705 0.213 47.604)", "--chart-1": "oklch(0.705 0.213 47.604)" },
  },
  teal: {
    light: { "--primary": "oklch(0.627 0.17 175.369)", "--ring": "oklch(0.627 0.17 175.369)", "--chart-1": "oklch(0.627 0.17 175.369)" },
    dark: { "--primary": "oklch(0.723 0.17 175.369)", "--ring": "oklch(0.723 0.17 175.369)", "--chart-1": "oklch(0.723 0.17 175.369)" },
  },
  pink: {
    light: { "--primary": "oklch(0.623 0.228 348.633)", "--ring": "oklch(0.623 0.228 348.633)", "--chart-1": "oklch(0.623 0.228 348.633)" },
    dark: { "--primary": "oklch(0.704 0.225 348.633)", "--ring": "oklch(0.704 0.225 348.633)", "--chart-1": "oklch(0.704 0.225 348.633)" },
  },
  indigo: {
    light: { "--primary": "oklch(0.546 0.245 270)", "--ring": "oklch(0.546 0.245 270)", "--chart-1": "oklch(0.546 0.245 270)" },
    dark: { "--primary": "oklch(0.623 0.214 265)", "--ring": "oklch(0.623 0.214 265)", "--chart-1": "oklch(0.623 0.214 265)" },
  },
  lime: {
    light: { "--primary": "oklch(0.648 0.212 130)", "--ring": "oklch(0.648 0.212 130)", "--chart-1": "oklch(0.648 0.212 130)" },
    dark: { "--primary": "oklch(0.75 0.19 130)", "--ring": "oklch(0.75 0.19 130)", "--chart-1": "oklch(0.75 0.19 130)" },
  },
  red: {
    light: { "--primary": "oklch(0.577 0.245 27.325)", "--ring": "oklch(0.577 0.245 27.325)", "--chart-1": "oklch(0.577 0.245 27.325)" },
    dark: { "--primary": "oklch(0.654 0.245 27.325)", "--ring": "oklch(0.654 0.245 27.325)", "--chart-1": "oklch(0.654 0.245 27.325)" },
  },
  sky: {
    light: { "--primary": "oklch(0.588 0.192 240.011)", "--ring": "oklch(0.588 0.192 240.011)", "--chart-1": "oklch(0.588 0.192 240.011)" },
    dark: { "--primary": "oklch(0.685 0.169 240.011)", "--ring": "oklch(0.685 0.169 240.011)", "--chart-1": "oklch(0.685 0.169 240.011)" },
  },
  fuchsia: {
    light: { "--primary": "oklch(0.586 0.233 318.812)", "--ring": "oklch(0.586 0.233 318.812)", "--chart-1": "oklch(0.586 0.233 318.812)" },
    dark: { "--primary": "oklch(0.667 0.222 318.812)", "--ring": "oklch(0.667 0.222 318.812)", "--chart-1": "oklch(0.667 0.222 318.812)" },
  },
  slate: {
    light: { "--primary": "oklch(0.446 0.018 270)", "--ring": "oklch(0.446 0.018 270)", "--chart-1": "oklch(0.446 0.018 270)" },
    dark: { "--primary": "oklch(0.606 0.018 270)", "--ring": "oklch(0.606 0.018 270)", "--chart-1": "oklch(0.606 0.018 270)" },
  },
};

const GRADIENTS: Record<GradientStyle, { light: string; dark: string } | null> = {
  none: null,
  subtle: {
    light: "linear-gradient(180deg, oklch(0.985 0 0) 0%, oklch(0.965 0.001 286) 100%)",
    dark: "linear-gradient(180deg, oklch(0.075 0.005 270) 0%, oklch(0.10 0.008 270) 100%)",
  },
  vivid: {
    light: "linear-gradient(135deg, oklch(0.92 0.08 280) 0%, oklch(0.95 0.05 320) 50%, oklch(0.92 0.06 200) 100%)",
    dark: "linear-gradient(135deg, oklch(0.12 0.04 280) 0%, oklch(0.15 0.03 320) 50%, oklch(0.12 0.03 200) 100%)",
  },
  aurora: {
    light: "linear-gradient(135deg, oklch(0.93 0.08 160) 0%, oklch(0.92 0.06 260) 50%, oklch(0.93 0.08 300) 100%)",
    dark: "linear-gradient(135deg, oklch(0.12 0.05 160) 0%, oklch(0.13 0.04 260) 50%, oklch(0.14 0.04 300) 100%)",
  },
  sunset: {
    light: "linear-gradient(160deg, oklch(0.92 0.08 30) 0%, oklch(0.90 0.08 350) 50%, oklch(0.88 0.06 300) 100%)",
    dark: "linear-gradient(160deg, oklch(0.15 0.05 30) 0%, oklch(0.13 0.04 350) 50%, oklch(0.12 0.04 300) 100%)",
  },
  ocean: {
    light: "linear-gradient(180deg, oklch(0.93 0.05 220) 0%, oklch(0.95 0.04 200) 100%)",
    dark: "linear-gradient(180deg, oklch(0.10 0.04 220) 0%, oklch(0.13 0.03 200) 100%)",
  },
  forest: {
    light: "linear-gradient(160deg, oklch(0.93 0.06 150) 0%, oklch(0.95 0.04 180) 100%)",
    dark: "linear-gradient(160deg, oklch(0.11 0.04 150) 0%, oklch(0.14 0.03 180) 100%)",
  },
  neon: {
    light: "linear-gradient(135deg, oklch(0.90 0.08 300) 0%, oklch(0.92 0.06 200) 50%, oklch(0.90 0.08 150) 100%)",
    dark: "linear-gradient(135deg, oklch(0.10 0.06 300) 0%, oklch(0.11 0.05 200) 50%, oklch(0.10 0.05 150) 100%)",
  },
  warm: {
    light: "linear-gradient(160deg, oklch(0.95 0.04 60) 0%, oklch(0.93 0.05 40) 100%)",
    dark: "linear-gradient(160deg, oklch(0.14 0.03 60) 0%, oklch(0.12 0.03 40) 100%)",
  },
  cool: {
    light: "linear-gradient(160deg, oklch(0.95 0.04 240) 0%, oklch(0.93 0.05 220) 100%)",
    dark: "linear-gradient(160deg, oklch(0.12 0.04 240) 0%, oklch(0.10 0.04 220) 100%)",
  },
};

const BACKGROUNDS: Record<BackgroundStyle, string> = {
  solid: "",
  mesh: "radial-gradient(at 40% 20%, oklch(var(--primary) / 8%) 0, transparent 50%), radial-gradient(at 80% 0%, oklch(var(--primary) / 5%) 0, transparent 50%), radial-gradient(at 0% 50%, oklch(var(--primary) / 6%) 0, transparent 50%)",
  dots: "radial-gradient(circle, oklch(var(--primary) / 10%) 1px, transparent 1px)",
  waves: "repeating-linear-gradient(0deg, oklch(var(--primary) / 3%) 0, oklch(var(--primary) / 3%) 2px, transparent 2px, transparent 20px)",
  circles: "radial-gradient(circle at 20% 80%, oklch(var(--primary) / 6%) 0, transparent 40%), radial-gradient(circle at 80% 20%, oklch(var(--primary) / 6%) 0, transparent 40%)",
  noise: "",
};

const STORAGE_KEY = "equilibra_theme_prefs";

const DEFAULT_PREFS: ThemePreferences = {
  theme: "dark",
  palette: "violet",
  gradient: "none",
  background: "solid",
  borderRadius: 1.0,
  cardBlur: 32,
  fontScale: 1.0,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefsState] = useState<ThemePreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS;
    } catch { return DEFAULT_PREFS; }
  });

  const setPrefs = useCallback((partial: Partial<ThemePreferences>) => {
    setPrefsState(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = prefs.theme === "dark";

    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");

    // Apply palette
    const paletteColors = isDark ? PALETTES[prefs.palette].dark : PALETTES[prefs.palette].light;
    Object.entries(paletteColors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Apply gradient
    const gradient = GRADIENTS[prefs.gradient];
    if (gradient) {
      root.style.setProperty("--app-bg", isDark ? gradient.dark : gradient.light);
    } else {
      root.style.removeProperty("--app-bg");
    }

    // Apply background pattern
    const bgPattern = BACKGROUNDS[prefs.background];
    root.style.setProperty("--app-bg-pattern", bgPattern || "");

    // Apply border radius
    root.style.setProperty("--radius", `${prefs.borderRadius}rem`);

    // Apply card blur
    root.style.setProperty("--card-blur", `${prefs.cardBlur}px`);

    // Apply font scale
    root.style.setProperty("--font-scale", prefs.fontScale.toString());
    root.style.fontSize = `${prefs.fontScale * 16}px`;
  }, [prefs]);

  const toggleTheme = useCallback(() => {
    setPrefs({ theme: prefs.theme === "dark" ? "light" : "dark" });
  }, [prefs.theme, setPrefs]);

  const resetPreferences = useCallback(() => {
    setPrefsState(DEFAULT_PREFS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFS));
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: prefs.theme,
        palette: prefs.palette,
        gradient: prefs.gradient,
        background: prefs.background,
        borderRadius: prefs.borderRadius,
        cardBlur: prefs.cardBlur,
        fontScale: prefs.fontScale,
        preferences: prefs,
        toggleTheme,
        setPalette: (p) => setPrefs({ palette: p }),
        setGradient: (g) => setPrefs({ gradient: g }),
        setBackground: (b) => setPrefs({ background: b }),
        setBorderRadius: (r) => setPrefs({ borderRadius: r }),
        setCardBlur: (b) => setPrefs({ cardBlur: b }),
        setFontScale: (s) => setPrefs({ fontScale: s }),
        setPreferences: setPrefs,
        resetPreferences,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useThemeContext must be used within ThemeProvider");
  return context;
}

export const COLOR_PALETTE_OPTIONS: { id: ColorPalette; label: string; color: string }[] = [
  { id: "violet", label: "Violet", color: "#7c3aed" },
  { id: "blue", label: "Bleu", color: "#3b82f6" },
  { id: "indigo", label: "Indigo", color: "#6366f1" },
  { id: "sky", label: "Ciel", color: "#0ea5e9" },
  { id: "cyan", label: "Cyan", color: "#06b6d4" },
  { id: "teal", label: "Sarcelle", color: "#14b8a6" },
  { id: "emerald", label: "Émeraude", color: "#10b981" },
  { id: "lime", label: "Lime", color: "#84cc16" },
  { id: "amber", label: "Ambre", color: "#f59e0b" },
  { id: "orange", label: "Orange", color: "#f97316" },
  { id: "red", label: "Rouge", color: "#ef4444" },
  { id: "rose", label: "Rose", color: "#f43f5e" },
  { id: "pink", label: "Pink", color: "#ec4899" },
  { id: "fuchsia", label: "Fuchsia", color: "#d946ef" },
  { id: "slate", label: "Ardoise", color: "#64748b" },
];

export const GRADIENT_OPTIONS: { id: GradientStyle; label: string; preview: string }[] = [
  { id: "none", label: "Aucun", preview: "bg-background" },
  { id: "subtle", label: "Subtil", preview: "linear-gradient(135deg, #f8f9fa, #e9ecef)" },
  { id: "vivid", label: "Vif", preview: "linear-gradient(135deg, #ddd6fe, #fbcfe8, #bae6fd)" },
  { id: "aurora", label: "Aurore", preview: "linear-gradient(135deg, #a7f3d0, #93c5fd, #c4b5fd)" },
  { id: "sunset", label: "Coucher", preview: "linear-gradient(160deg, #fed7aa, #fecdd3, #ddd6fe)" },
  { id: "ocean", label: "Océan", preview: "linear-gradient(180deg, #bae6fd, #cffafe)" },
  { id: "forest", label: "Forêt", preview: "linear-gradient(160deg, #a7f3d0, #ccfbf1)" },
  { id: "neon", label: "Néon", preview: "linear-gradient(135deg, #f0abfc, #93c5fd, #86efac)" },
  { id: "warm", label: "Chaud", preview: "linear-gradient(160deg, #fef3c7, #ffedd5)" },
  { id: "cool", label: "Froid", preview: "linear-gradient(160deg, #dbeafe, #bae6fd)" },
];

export const BACKGROUND_OPTIONS: { id: BackgroundStyle; label: string; icon: string }[] = [
  { id: "solid", label: "Solide", icon: "◻️" },
  { id: "mesh", label: "Mesh", icon: "🕸️" },
  { id: "dots", label: "Points", icon: "⚫" },
  { id: "waves", label: "Vagues", icon: "🌊" },
  { id: "circles", label: "Cercles", icon: "⭕" },
];
