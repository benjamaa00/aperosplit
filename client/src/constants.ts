import type { Member } from "./types";

export const CATEGORIES = [
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

export const DEFAULT_MEMBERS: Member[] = [
  { id: "admin", name: "Mohamed", avatar: "👨‍💼" },
  { id: "2", name: "Amine", avatar: "👨" },
  { id: "3", name: "Isma", avatar: "👨‍🦱" },
  { id: "4", name: "Rachid", avatar: "👨‍🦲" },
  { id: "5", name: "Yasmina", avatar: "👩" },
];

export const STORAGE_KEY = "equilibra_data";
export const GROUP_ID = "equilibra-fixed-group";

export const CHART_COLORS = ["#34d399", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa", "#fb923c", "#2dd4bf", "#e879f9"];

export const spring = { type: "spring" as const, stiffness: 300, damping: 30 };
export const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
};
