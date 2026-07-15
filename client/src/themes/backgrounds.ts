export interface BackgroundDefinition {
  id: string;
  name: string;
  emoji: string;
  category: "solid" | "gradient" | "pattern" | "texture" | "animated";
  cssLight: string;
  cssDark: string;
  isAnimated: boolean;
  preview: string;
}

export const BACKGROUND_DEFINITIONS: BackgroundDefinition[] = [
  // ── Solid (5) ──────────────────────────────────────────────
  {
    id: "pur",
    name: "Pur",
    emoji: "⬜",
    category: "solid",
    cssLight: "#ffffff",
    cssDark: "#121212",
    isAnimated: false,
    preview: "#ffffff",
  },
  {
    id: "noir-absolu",
    name: "Noir Absolu",
    emoji: "⬛",
    category: "solid",
    cssLight: "#0a0a0a",
    cssDark: "#050505",
    isAnimated: false,
    preview: "#0a0a0a",
  },
  {
    id: "blanc-pur",
    name: "Blanc Pur",
    emoji: "🔘",
    category: "solid",
    cssLight: "#f8f9fa",
    cssDark: "#1a1a2e",
    isAnimated: false,
    preview: "#f8f9fa",
  },
  {
    id: "gris-chaud",
    name: "Gris Chaud",
    emoji: "🩶",
    category: "solid",
    cssLight: "#f5f5f0",
    cssDark: "#1e1e1c",
    isAnimated: false,
    preview: "#f5f5f0",
  },
  {
    id: "gris-froid",
    name: "Gris Froid",
    emoji: "🩶",
    category: "solid",
    cssLight: "#f0f2f5",
    cssDark: "#1a1c22",
    isAnimated: false,
    preview: "#f0f2f5",
  },

  // ── Gradient (8) ──────────────────────────────────────────
  {
    id: "oiseau",
    name: "Oiseau",
    emoji: "🐦",
    category: "gradient",
    cssLight: "linear-gradient(180deg, #a8edea 0%, #fed6e3 100%)",
    cssDark: "linear-gradient(180deg, #1a3a3a 0%, #3a1a2a 100%)",
    isAnimated: false,
    preview: "#fed6e3",
  },
  {
    id: "horizon",
    name: "Horizon",
    emoji: "🌅",
    category: "gradient",
    cssLight: "linear-gradient(180deg, #ffecd2 0%, #fcb69f 50%, #ff9a9e 100%)",
    cssDark: "linear-gradient(180deg, #3a2a1a 0%, #4a2a2a 50%, #3a1a1a 100%)",
    isAnimated: false,
    preview: "#fcb69f",
  },
  {
    id: "ocean-profond",
    name: "Océan Profond",
    emoji: "🌊",
    category: "gradient",
    cssLight: "linear-gradient(180deg, #667eea 0%, #0c3483 50%, #0a1a4a 100%)",
    cssDark: "linear-gradient(180deg, #2a3a6a 0%, #0c2453 50%, #050d2a 100%)",
    isAnimated: false,
    preview: "#0c3483",
  },
  {
    id: "foret-brume",
    name: "Forêt Brume",
    emoji: "🌲",
    category: "gradient",
    cssLight: "linear-gradient(160deg, #134e5e 0%, #71b280 100%)",
    cssDark: "linear-gradient(160deg, #0a2e36 0%, #3a5940 100%)",
    isAnimated: false,
    preview: "#71b280",
  },
  {
    id: "sunset-glow",
    name: "Sunset Glow",
    emoji: "🌇",
    category: "gradient",
    cssLight: "linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #fda085 100%)",
    cssDark: "linear-gradient(135deg, #3a1a3a 0%, #4a1a2a 50%, #3a2a1a 100%)",
    isAnimated: false,
    preview: "#f5576c",
  },
  {
    id: "midnight-rain",
    name: "Midnight Rain",
    emoji: "🌧️",
    category: "gradient",
    cssLight: "linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 40%, #2d1b69 100%)",
    cssDark: "linear-gradient(135deg, #06060f 0%, #0e0e22 40%, #1a1040 100%)",
    isAnimated: false,
    preview: "#2d1b69",
  },
  {
    id: "aurora-boreale",
    name: "Aurora Boréale",
    emoji: "🌌",
    category: "gradient",
    cssLight: "radial-gradient(ellipse at top, #667eea 0%, #764ba2 50%, #f093fb 100%)",
    cssDark: "radial-gradient(ellipse at top, #2a3a6a 0%, #3a2a52 50%, #4a1a3a 100%)",
    isAnimated: false,
    preview: "#764ba2",
  },
  {
    id: "velvet",
    name: "Velvet",
    emoji: "🎭",
    category: "gradient",
    cssLight: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
    cssDark: "linear-gradient(135deg, #3a0a6a 0%, #1240a0 100%)",
    isAnimated: false,
    preview: "#6a11cb",
  },

  // ── Pattern (12) ──────────────────────────────────────────
  {
    id: "dots-fins",
    name: "Dots Fins",
    emoji: "🔹",
    category: "pattern",
    cssLight: "radial-gradient(circle, #00000012 1px, transparent 1px) #ffffff",
    cssDark: "radial-gradient(circle, #ffffff12 1px, transparent 1px) #1a1a2e",
    isAnimated: false,
    preview: "#e8e8f0",
  },
  {
    id: "dots-gros",
    name: "Dots Gros",
    emoji: "⚫",
    category: "pattern",
    cssLight: "radial-gradient(circle, #00000010 2.5px, transparent 2.5px) #f8f9fa",
    cssDark: "radial-gradient(circle, #ffffff10 2.5px, transparent 2.5px) #1a1a2e",
    isAnimated: false,
    preview: "#e0e0e8",
  },
  {
    id: "maille",
    name: "Maille",
    emoji: "🧶",
    category: "pattern",
    cssLight: "repeating-linear-gradient(0deg, transparent, transparent 9px, #00000008 9px, #00000008 10px), repeating-linear-gradient(90deg, transparent, transparent 9px, #00000008 9px, #00000008 10px) #f5f5f0",
    cssDark: "repeating-linear-gradient(0deg, transparent, transparent 9px, #ffffff08 9px, #ffffff08 10px), repeating-linear-gradient(90deg, transparent, transparent 9px, #ffffff08 9px, #ffffff08 10px) #1e1e1c",
    isAnimated: false,
    preview: "#e8e8e0",
  },
  {
    id: "carreau",
    name: "Carreau",
    emoji: "🏁",
    category: "pattern",
    cssLight: "repeating-conic-gradient(#00000006 0% 25%, transparent 0% 50%) 50% / 24px 24px #ffffff",
    cssDark: "repeating-conic-gradient(#ffffff06 0% 25%, transparent 0% 50%) 50% / 24px 24px #1a1a2e",
    isAnimated: false,
    preview: "#e8e8f0",
  },
  {
    id: "zigzag",
    name: "Zigzag",
    emoji: "⚡",
    category: "pattern",
    cssLight: "linear-gradient(135deg, #00000008 25%, transparent 25%) -12px 0, linear-gradient(225deg, #00000008 25%, transparent 25%) -12px 0, linear-gradient(315deg, #00000008 25%, transparent 25%), linear-gradient(45deg, #00000008 25%, transparent 25%) #f8f9fa",
    cssDark: "linear-gradient(135deg, #ffffff08 25%, transparent 25%) -12px 0, linear-gradient(225deg, #ffffff08 25%, transparent 25%) -12px 0, linear-gradient(315deg, #ffffff08 25%, transparent 25%), linear-gradient(45deg, #ffffff08 25%, transparent 25%) #1a1a2e",
    isAnimated: false,
    preview: "#e8e8f0",
  },
  {
    id: "vagues",
    name: "Vagues",
    emoji: "🌊",
    category: "pattern",
    cssLight: "repeating-linear-gradient(45deg, transparent, transparent 10px, #00000005 10px, #00000005 11px), repeating-linear-gradient(-45deg, transparent, transparent 10px, #00000005 10px, #00000005 11px) #f0f2f5",
    cssDark: "repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff05 10px, #ffffff05 11px), repeating-linear-gradient(-45deg, transparent, transparent 10px, #ffffff05 10px, #ffffff05 11px) #1a1c22",
    isAnimated: false,
    preview: "#e8eaef",
  },
  {
    id: "hexagones",
    name: "Hexagones",
    emoji: "⬡",
    category: "pattern",
    cssLight: "conic-gradient(from 30deg, #00000006 0% 25%, transparent 0% 50%) 50% / 28px 48px, conic-gradient(from 210deg, #00000006 0% 25%, transparent 0% 50%) 50% / 28px 48px #f8f9fa",
    cssDark: "conic-gradient(from 30deg, #ffffff06 0% 25%, transparent 0% 50%) 50% / 28px 48px, conic-gradient(from 210deg, #ffffff06 0% 25%, transparent 0% 50%) 50% / 28px 48px #1a1a2e",
    isAnimated: false,
    preview: "#e8e8f0",
  },
  {
    id: "triangles",
    name: "Triangles",
    emoji: "🔺",
    category: "pattern",
    cssLight: "linear-gradient(60deg, #00000008 25%, transparent 25.5%, transparent 75%, #00000008 75%, #00000008) 50% / 32px 55px, linear-gradient(60deg, #00000008 25%, transparent 25.5%, transparent 75%, #00000008 75%, #00000008) 16px 28px / 32px 55px #f5f5f0",
    cssDark: "linear-gradient(60deg, #ffffff08 25%, transparent 25.5%, transparent 75%, #ffffff08 75%, #ffffff08) 50% / 32px 55px, linear-gradient(60deg, #ffffff08 25%, transparent 25.5%, transparent 75%, #ffffff08 75%, #ffffff08) 16px 28px / 32px 55px #1e1e1c",
    isAnimated: false,
    preview: "#e8e8e0",
  },
  {
    id: "etoiles",
    name: "Étoiles",
    emoji: "⭐",
    category: "pattern",
    cssLight: "radial-gradient(circle, #00000010 1.5px, transparent 1.5px), radial-gradient(circle, #00000008 1px, transparent 1px) 10px 10px #f0f2f5",
    cssDark: "radial-gradient(circle, #ffffff15 1.5px, transparent 1.5px), radial-gradient(circle, #ffffff10 1px, transparent 1px) 10px 10px #1a1c22",
    isAnimated: false,
    preview: "#e8eaef",
  },
  {
    id: "coquillage",
    name: "Coquillage",
    emoji: "🐚",
    category: "pattern",
    cssLight: "repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 10px, #00000006 10px, #00000006 11px) #f8f9fa",
    cssDark: "repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 10px, #ffffff06 10px, #ffffff06 11px) #1a1a2e",
    isAnimated: false,
    preview: "#e8e8f0",
  },
  {
    id: "mille-carres",
    name: "Mille Carrés",
    emoji: "🔲",
    category: "pattern",
    cssLight: "repeating-linear-gradient(0deg, transparent, transparent 14px, #00000005 14px, #00000005 15px), repeating-linear-gradient(90deg, transparent, transparent 14px, #00000005 14px, #00000005 15px) #f5f5f0",
    cssDark: "repeating-linear-gradient(0deg, transparent, transparent 14px, #ffffff05 14px, #ffffff05 15px), repeating-linear-gradient(90deg, transparent, transparent 14px, #ffffff05 14px, #ffffff05 15px) #1e1e1c",
    isAnimated: false,
    preview: "#e8e8e0",
  },
  {
    id: "losanges",
    name: "Losanges",
    emoji: "💎",
    category: "pattern",
    cssLight: "linear-gradient(45deg, #00000008 25%, transparent 25%, transparent 75%, #00000008 75%, #00000008) 50% / 20px 20px, linear-gradient(45deg, #00000008 25%, transparent 25%, transparent 75%, #00000008 75%, #00000008) 10px 10px / 20px 20px #f0f2f5",
    cssDark: "linear-gradient(45deg, #ffffff08 25%, transparent 25%, transparent 75%, #ffffff08 75%, #ffffff08) 50% / 20px 20px, linear-gradient(45deg, #ffffff08 25%, transparent 25%, transparent 75%, #ffffff08 75%, #ffffff08) 10px 10px / 20px 20px #1a1c22",
    isAnimated: false,
    preview: "#e8eaef",
  },

  // ── Texture (9) ──────────────────────────────────────────
  {
    id: "papier",
    name: "Papier",
    emoji: "📜",
    category: "texture",
    cssLight:
      "linear-gradient(135deg, #f5f0e8 25%, transparent 25%), " +
      "linear-gradient(225deg, #f5f0e8 25%, transparent 25%), " +
      "linear-gradient(315deg, #f5f0e8 25%, transparent 25%), " +
      "linear-gradient(45deg, #f5f0e8 25%, transparent 25%)",
    cssDark:
      "linear-gradient(135deg, #2a2520 25%, transparent 25%), " +
      "linear-gradient(225deg, #2a2520 25%, transparent 25%), " +
      "linear-gradient(315deg, #2a2520 25%, transparent 25%), " +
      "linear-gradient(45deg, #2a2520 25%, transparent 25%)",
    isAnimated: false,
    preview: "#f5f0e8",
  },
  {
    id: "toile",
    name: "Toile",
    emoji: "🎨",
    category: "texture",
    cssLight:
      "repeating-linear-gradient(0deg, transparent, transparent 2px, #d4c9b820 2px, #d4c9b820 4px), " +
      "repeating-linear-gradient(90deg, transparent, transparent 2px, #d4c9b820 2px, #d4c9b820 4px) #f0ebe0",
    cssDark:
      "repeating-linear-gradient(0deg, transparent, transparent 2px, #8a7a6a20 2px, #8a7a6a20 4px), " +
      "repeating-linear-gradient(90deg, transparent, transparent 2px, #8a7a6a20 2px, #8a7a6a20 4px) #2a2520",
    isAnimated: false,
    preview: "#f0ebe0",
  },
  {
    id: "bois-clair",
    name: "Bois Clair",
    emoji: "🪵",
    category: "texture",
    cssLight:
      "repeating-linear-gradient(90deg, #d4a57415 0px, transparent 1px, transparent 3px, #d4a57410 4px, transparent 5px, transparent 18px, #c8956a12 18px, transparent 19px, transparent 20px), " +
      "repeating-linear-gradient(0deg, transparent 0px, transparent 60px, #c8956a08 60px, transparent 61px) #f5e6d3",
    cssDark:
      "repeating-linear-gradient(90deg, #5a3a2015 0px, transparent 1px, transparent 3px, #5a3a2010 4px, transparent 5px, transparent 18px, #4a302012 18px, transparent 19px, transparent 20px), " +
      "repeating-linear-gradient(0deg, transparent 0px, transparent 60px, #4a302008 60px, transparent 61px) #2a1e16",
    isAnimated: false,
    preview: "#f5e6d3",
  },
  {
    id: "marbre",
    name: "Marbre",
    emoji: "🪨",
    category: "texture",
    cssLight:
      "linear-gradient(135deg, #e8e0d810 25%, transparent 25%, transparent 50%, #e8e0d810 50%, #e8e0d810 75%, transparent 75%) 0 0 / 60px 60px, " +
      "radial-gradient(ellipse at 20% 50%, #d8d0c820, transparent 60%), " +
      "radial-gradient(ellipse at 80% 30%, #c8c0b815, transparent 50%) #f0ece8",
    cssDark:
      "linear-gradient(135deg, #3a352f10 25%, transparent 25%, transparent 50%, #3a352f10 50%, #3a352f10 75%, transparent 75%) 0 0 / 60px 60px, " +
      "radial-gradient(ellipse at 20% 50%, #2a252020, transparent 60%), " +
      "radial-gradient(ellipse at 80% 30%, #25201a15, transparent 50%) #1a1815",
    isAnimated: false,
    preview: "#f0ece8",
  },
  {
    id: "pierre-naturelle",
    name: "Pierre Naturelle",
    emoji: "🏔️",
    category: "texture",
    cssLight:
      "radial-gradient(circle at 20% 30%, #c4b8a820, transparent 40%), " +
      "radial-gradient(circle at 70% 60%, #b8a89818, transparent 35%), " +
      "radial-gradient(circle at 45% 80%, #d0c4b415, transparent 30%), " +
      "linear-gradient(180deg, #e8e0d4 0%, #d8cec0 100%)",
    cssDark:
      "radial-gradient(circle at 20% 30%, #3a322820, transparent 40%), " +
      "radial-gradient(circle at 70% 60%, #30282018, transparent 35%), " +
      "radial-gradient(circle at 45% 80%, #3a342815, transparent 30%), " +
      "linear-gradient(180deg, #2a2420 0%, #201c18 100%)",
    isAnimated: false,
    preview: "#d8cec0",
  },
  {
    id: "lin",
    name: "Lin",
    emoji: "🧵",
    category: "texture",
    cssLight:
      "repeating-linear-gradient(0deg, transparent, transparent 1px, #c8bfb012 1px, #c8bfb012 2px), " +
      "repeating-linear-gradient(90deg, transparent, transparent 1px, #c8bfb012 1px, #c8bfb012 2px) #f2ede5",
    cssDark:
      "repeating-linear-gradient(0deg, transparent, transparent 1px, #5a524a12 1px, #5a524a12 2px), " +
      "repeating-linear-gradient(90deg, transparent, transparent 1px, #5a524a12 1px, #5a524a12 2px) #22201c",
    isAnimated: false,
    preview: "#f2ede5",
  },
  {
    id: "cuir",
    name: "Cuir",
    emoji: "👜",
    category: "texture",
    cssLight:
      "radial-gradient(circle at 30% 40%, #a0845c18, transparent 30%), " +
      "radial-gradient(circle at 60% 70%, #8a704a15, transparent 25%), " +
      "radial-gradient(circle at 80% 20%, #9a7a5012, transparent 28%), " +
      "linear-gradient(135deg, #b89a6a 0%, #a0845c 50%, #8a7040 100%)",
    cssDark:
      "radial-gradient(circle at 30% 40%, #3a2a1818, transparent 30%), " +
      "radial-gradient(circle at 60% 70%, #30241815, transparent 25%), " +
      "radial-gradient(circle at 80% 20%, #3a281812, transparent 28%), " +
      "linear-gradient(135deg, #3a2a18 0%, #302418 50%, #281e14 100%)",
    isAnimated: false,
    preview: "#a0845c",
  },
  {
    id: "brique",
    name: "Brique",
    emoji: "🧱",
    category: "texture",
    cssLight:
      "repeating-linear-gradient(0deg, transparent 0px, transparent 18px, #e8d8c830 18px, #e8d8c830 20px), " +
      "repeating-linear-gradient(90deg, transparent 0px, transparent 38px, #e8d8c830 38px, #e8d8c830 40px), " +
      "linear-gradient(180deg, #c4956a 0%, #b8845c 50%, #a8744c 100%)",
    cssDark:
      "repeating-linear-gradient(0deg, transparent 0px, transparent 18px, #3a2a1a30 18px, #3a2a1a30 20px), " +
      "repeating-linear-gradient(90deg, transparent 0px, transparent 38px, #3a2a1a30 38px, #3a2a1a30 40px), " +
      "linear-gradient(180deg, #3a2218 0%, #342018 50%, #2e1c14 100%)",
    isAnimated: false,
    preview: "#c4956a",
  },
  {
    id: "beton",
    name: "Béton",
    emoji: "🏗️",
    category: "texture",
    cssLight:
      "radial-gradient(circle at 15% 25%, #c0bbb518, transparent 30%), " +
      "radial-gradient(circle at 55% 65%, #b0aba515, transparent 25%), " +
      "radial-gradient(circle at 85% 15%, #c8c3bd12, transparent 28%), " +
      "radial-gradient(circle at 40% 85%, #bab5af10, transparent 32%), " +
      "linear-gradient(180deg, #c8c3bd 0%, #b8b3ad 50%, #a8a3a0 100%)",
    cssDark:
      "radial-gradient(circle at 15% 25%, #3a383518, transparent 30%), " +
      "radial-gradient(circle at 55% 65%, #302e2b15, transparent 25%), " +
      "radial-gradient(circle at 85% 15%, #3a383512, transparent 28%), " +
      "radial-gradient(circle at 40% 85%, #35322e10, transparent 32%), " +
      "linear-gradient(180deg, #2a2825 0%, #252220 50%, #201e1c 100%)",
    isAnimated: false,
    preview: "#c8c3bd",
  },

  // ── Animated (8) ──────────────────────────────────────────
  {
    id: "gradient-anime",
    name: "Gradient Animé",
    emoji: "🌈",
    category: "animated",
    cssLight:
      "linear-gradient(-45deg, #ff9a9e, #fad0c4, #a1c4fd, #c2e9fb) / 400% 400% " +
      "animation: gradient-shift 8s ease infinite",
    cssDark:
      "linear-gradient(-45deg, #4a2a2a, #3a2a1a, #1a2a4a, #1a3a4a) / 400% 400% " +
      "animation: gradient-shift 8s ease infinite",
    isAnimated: true,
    preview: "#fad0c4",
  },
  {
    id: "aurore-mobile",
    name: "Aurore Mobile",
    emoji: "🌌",
    category: "animated",
    cssLight:
      "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #667eea 75%, #764ba2 100%) / 300% 300% " +
      "animation: aurora-move 12s ease infinite",
    cssDark:
      "linear-gradient(135deg, #2a3a6a 0%, #3a2a52 25%, #4a1a3a 50%, #2a3a6a 75%, #3a2a52 100%) / 300% 300% " +
      "animation: aurora-move 12s ease infinite",
    isAnimated: true,
    preview: "#764ba2",
  },
  {
    id: "ocean-wave",
    name: "Ocean Wave",
    emoji: "🌊",
    category: "animated",
    cssLight:
      "linear-gradient(90deg, #a8edea, #fed6e3, #a8edea, #fed6e3) / 400% 100% " +
      "animation: wave-move 6s linear infinite",
    cssDark:
      "linear-gradient(90deg, #1a3a3a, #3a1a2a, #1a3a3a, #3a1a2a) / 400% 100% " +
      "animation: wave-move 6s linear infinite",
    isAnimated: true,
    preview: "#a8edea",
  },
  {
    id: "lava-flow",
    name: "Lava Flow",
    emoji: "🌋",
    category: "animated",
    cssLight:
      "linear-gradient(45deg, #f12711, #f5af19, #f12711, #c62828) / 300% 300% " +
      "animation: lava-pulse 5s ease-in-out infinite",
    cssDark:
      "linear-gradient(45deg, #5a1008, #5a3a08, #5a1008, #4a1010) / 300% 300% " +
      "animation: lava-pulse 5s ease-in-out infinite",
    isAnimated: true,
    preview: "#f5af19",
  },
  {
    id: "matrix-pluie",
    name: "Matrix Pluie",
    emoji: "💚",
    category: "animated",
    cssLight:
      "repeating-linear-gradient(0deg, #00000015 0px, transparent 1px, transparent 14px, #00ff4118 14px, transparent 15px) / 100% 100% " +
      "animation: matrix-fall 3s linear infinite",
    cssDark:
      "repeating-linear-gradient(0deg, #00330015 0px, transparent 1px, transparent 14px, #00ff4120 14px, transparent 15px) / 100% 100% " +
      "animation: matrix-fall 3s linear infinite",
    isAnimated: true,
    preview: "#00ff41",
  },
  {
    id: "cosmic-dust",
    name: "Cosmic Dust",
    emoji: "✨",
    category: "animated",
    cssLight:
      "radial-gradient(circle at 20% 50%, #667eea20, transparent 50%), " +
      "radial-gradient(circle at 80% 50%, #f093fb20, transparent 50%), " +
      "linear-gradient(180deg, #0c0c1d, #1a1a3e) / 200% 200% " +
      "animation: cosmic-drift 15s ease-in-out infinite",
    cssDark:
      "radial-gradient(circle at 20% 50%, #667eea15, transparent 50%), " +
      "radial-gradient(circle at 80% 50%, #f093fb15, transparent 50%), " +
      "linear-gradient(180deg, #06060f, #0e0e22) / 200% 200% " +
      "animation: cosmic-drift 15s ease-in-out infinite",
    isAnimated: true,
    preview: "#1a1a3e",
  },
  {
    id: "neon-pulse",
    name: "Neon Pulse",
    emoji: "💜",
    category: "animated",
    cssLight:
      "linear-gradient(135deg, #6a11cb, #2575fc, #f093fb, #6a11cb) / 300% 300% " +
      "animation: neon-breathe 4s ease-in-out infinite",
    cssDark:
      "linear-gradient(135deg, #3a0a6a, #1240a0, #4a1a3a, #3a0a6a) / 300% 300% " +
      "animation: neon-breathe 4s ease-in-out infinite",
    isAnimated: true,
    preview: "#6a11cb",
  },
  {
    id: "rainbow-shift",
    name: "Rainbow Shift",
    emoji: "🌈",
    category: "animated",
    cssLight:
      "linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b) / 600% 100% " +
      "animation: rainbow-cycle 10s linear infinite",
    cssDark:
      "linear-gradient(90deg, #8a3030, #6a5a20, #206080, #6a3060, #204060, #2a1550, #8a3030) / 600% 100% " +
      "animation: rainbow-cycle 10s linear infinite",
    isAnimated: true,
    preview: "#ff9ff3",
  },
];

export function getBackgroundById(id: string): BackgroundDefinition | undefined {
  return BACKGROUND_DEFINITIONS.find((bg) => bg.id === id);
}

export const BACKGROUND_CATEGORIES: { id: string; label: string; emoji: string }[] = [
  { id: "solid", label: "Unis", emoji: "⬜" },
  { id: "gradient", label: "Dégradés", emoji: "🌈" },
  { id: "pattern", label: "Motifs", emoji: "🔲" },
  { id: "texture", label: "Textures", emoji: "🪨" },
  { id: "animated", label: "Animés", emoji: "✨" },
];

export const BACKGROUND_ANIMATION_KEYFRAMES: string = `
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes aurora-move {
  0% { background-position: 0% 0%; }
  25% { background-position: 100% 0%; }
  50% { background-position: 100% 100%; }
  75% { background-position: 0% 100%; }
  100% { background-position: 0% 0%; }
}

@keyframes wave-move {
  0% { background-position: 0% 50%; }
  100% { background-position: 400% 50%; }
}

@keyframes lava-pulse {
  0% { background-position: 0% 0%; }
  33% { background-position: 100% 100%; }
  66% { background-position: 50% 0%; }
  100% { background-position: 0% 0%; }
}

@keyframes matrix-fall {
  0% { background-position: 0% -100%; }
  100% { background-position: 0% 100%; }
}

@keyframes cosmic-drift {
  0% { background-position: 0% 0%; }
  25% { background-position: 50% 100%; }
  50% { background-position: 100% 50%; }
  75% { background-position: 50% 0%; }
  100% { background-position: 0% 0%; }
}

@keyframes neon-breathe {
  0% { background-position: 0% 50%; filter: brightness(1); }
  50% { background-position: 100% 50%; filter: brightness(1.15); }
  100% { background-position: 0% 50%; filter: brightness(1); }
}

@keyframes rainbow-cycle {
  0% { background-position: 0% 50%; }
  100% { background-position: 600% 50%; }
}
`.trim();
