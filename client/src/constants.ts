import type { Member } from "./types";

export const CATEGORY_SECTIONS = [
  {
    title: "Restauration",
    emoji: "🍽️",
    color: "#f97316",
    items: [
      { name: "Restaurant", emoji: "🍝", color: "#f97316" },
      { name: "Café", emoji: "☕", color: "#92400e" },
      { name: "Fast-food", emoji: "🍔", color: "#dc2626" },
      { name: "Pizzeria", emoji: "🍕", color: "#ea580c" },
      { name: "Sushi", emoji: "🍣", color: "#e11d48" },
      { name: "Tacos", emoji: "🌮", color: "#16a34a" },
      { name: "Boulangerie", emoji: "🥐", color: "#d97706" },
      { name: "Livraison", emoji: "🛵", color: "#7c3aed" },
    ],
  },
  {
    title: "Courses",
    emoji: "🛒",
    color: "#22c55e",
    items: [
      { name: "Supermarché", emoji: "🏪", color: "#16a34a" },
      { name: "Fruits & Légumes", emoji: "🍎", color: "#dc2626" },
      { name: "Boucherie", emoji: "🥩", color: "#b91c1c" },
      { name: "Poissonnerie", emoji: "🐟", color: "#0284c7" },
      { name: "Boissons", emoji: "🥤", color: "#0ea5e9" },
      { name: "Snacks", emoji: "🍿", color: "#f59e0b" },
      { name: "Ménager", emoji: "🧹", color: "#6b7280" },
    ],
  },
  {
    title: "Soirées & Fêtes",
    emoji: "🥂",
    color: "#a855f7",
    items: [
      { name: "Apéro", emoji: "🍷", color: "#be185d" },
      { name: "Bière", emoji: "🍺", color: "#d97706" },
      { name: "Cocktails", emoji: "🍸", color: "#06b6d4" },
      { name: "Champagne", emoji: "🍾", color: "#eab308" },
      { name: "Barbecue", emoji: "🍖", color: "#dc2626" },
      { name: "Décoration", emoji: "🎀", color: "#ec4899" },
      { name: "DJ / Sono", emoji: "🎧", color: "#7c3aed" },
    ],
  },
  {
    title: "Loisirs",
    emoji: "🎭",
    color: "#3b82f6",
    items: [
      { name: "Cinéma", emoji: "🎬", color: "#1e40af" },
      { name: "Concert", emoji: "🎵", color: "#7c3aed" },
      { name: "Bowling", emoji: "🎳", color: "#0891b2" },
      { name: "Escape Game", emoji: "🔐", color: "#059669" },
      { name: "Karting", emoji: "🏎️", color: "#dc2626" },
      { name: "Plage", emoji: "🏖️", color: "#0ea5e9" },
      { name: "Piscine", emoji: "🏊", color: "#0284c7" },
      { name: "Camping", emoji: "⛺", color: "#16a34a" },
    ],
  },
  {
    title: "Transport",
    emoji: "🚗",
    color: "#eab308",
    items: [
      { name: "Essence", emoji: "⛽", color: "#16a34a" },
      { name: "Taxi / Uber", emoji: "🚕", color: "#eab308" },
      { name: "Parking", emoji: "🅿️", color: "#2563eb" },
      { name: "Péage", emoji: "🛣️", color: "#78716c" },
      { name: "Bus / Tram", emoji: "🚌", color: "#ea580c" },
      { name: "Train", emoji: "🚆", color: "#2563eb" },
      { name: "Location voiture", emoji: "🚙", color: "#059669" },
    ],
  },
  {
    title: "Voyages",
    emoji: "✈️",
    color: "#06b6d4",
    items: [
      { name: "Hôtel", emoji: "🏨", color: "#1d4ed8" },
      { name: "Airbnb", emoji: "🏡", color: "#16a34a" },
      { name: "Vol", emoji: "✈️", color: "#0ea5e9" },
      { name: "Excursion", emoji: "🗺️", color: "#ca8a04" },
      { name: "Souvenirs", emoji: "🛍️", color: "#ec4899" },
    ],
  },
  {
    title: "Maison",
    emoji: "🏠",
    color: "#ec4899",
    items: [
      { name: "Loyer", emoji: "🏠", color: "#be185d" },
      { name: "Électricité", emoji: "💡", color: "#eab308" },
      { name: "Internet", emoji: "📶", color: "#2563eb" },
      { name: "Meubles", emoji: "🛋️", color: "#92400e" },
      { name: "Réparations", emoji: "🔧", color: "#78716c" },
      { name: "Décoration", emoji: "🖼️", color: "#7c3aed" },
    ],
  },
  {
    title: "Shopping",
    emoji: "🛍️",
    color: "#f43f5e",
    items: [
      { name: "Vêtements", emoji: "👕", color: "#7c3aed" },
      { name: "Électronique", emoji: "💻", color: "#2563eb" },
      { name: "Accessoires", emoji: "💍", color: "#ec4899" },
      { name: "Livres", emoji: "📚", color: "#16a34a" },
      { name: "Cadeaux", emoji: "🎁", color: "#dc2626" },
    ],
  },
  {
    title: "Santé & Sport",
    emoji: "🏥",
    color: "#10b981",
    items: [
      { name: "Médecin", emoji: "🩺", color: "#059669" },
      { name: "Pharmacie", emoji: "💊", color: "#0ea5e9" },
      { name: "Dentiste", emoji: "🦷", color: "#f5f5f4" },
      { name: "Salle de sport", emoji: "🏋️", color: "#dc2626" },
      { name: "Assurance", emoji: "🛡️", color: "#2563eb" },
    ],
  },
  {
    title: "Éducation",
    emoji: "🎓",
    color: "#0ea5e9",
    items: [
      { name: "Cours", emoji: "📖", color: "#0369a1" },
      { name: "Livres", emoji: "📚", color: "#16a34a" },
      { name: "Formation", emoji: "💡", color: "#eab308" },
      { name: "Frais de scolarité", emoji: "🎓", color: "#0ea5e9" },
    ],
  },
  {
    title: "Jeux & Jeux vidéo",
    emoji: "🎮",
    color: "#8b5cf6",
    items: [
      { name: "Jeux de société", emoji: "🎲", color: "#7c3aed" },
      { name: "Console", emoji: "🕹️", color: "#1d4ed8" },
      { name: "Jeux vidéo", emoji: "🎮", color: "#059669" },
      { name: "Poker", emoji: "♠️", color: "#1e1e1e" },
    ],
  },
  {
    title: "Animaux",
    emoji: "🐶",
    color: "#f59e0b",
    items: [
      { name: "Nourriture", emoji: "🦴", color: "#92400e" },
      { name: "Vétérinaire", emoji: "🏥", color: "#059669" },
      { name: "Accessoires", emoji: "🦮", color: "#d97706" },
    ],
  },
  {
    title: "Abonnements",
    emoji: "📱",
    color: "#6366f1",
    items: [
      { name: "Netflix", emoji: "🎬", color: "#dc2626" },
      { name: "Spotify", emoji: "🎵", color: "#16a34a" },
      { name: "Disney+", emoji: "✨", color: "#2563eb" },
      { name: "Prime Video", emoji: "📦", color: "#0ea5e9" },
      { name: "ChatGPT", emoji: "🤖", color: "#059669" },
    ],
  },
  {
    title: "Divers",
    emoji: "✨",
    color: "#64748b",
    items: [
      { name: "Frais partagés", emoji: "🤝", color: "#0891b2" },
      { name: "Dons", emoji: "💖", color: "#ec4899" },
      { name: "Autres", emoji: "📦", color: "#64748b" },
    ],
  },
];

export const CATEGORIES = CATEGORY_SECTIONS.flatMap((s) => s.items);

export const STORAGE_KEY = "equilibra_data";
export const GROUP_ID = "equilibra-fixed-group";

export const CHART_COLORS = ["#34d399", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa", "#fb923c", "#2dd4bf", "#e879f9"];

export const spring = { type: "spring" as const, stiffness: 300, damping: 30 };
export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: "easeOut" as const },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
  transition: { type: "spring" as const, stiffness: 400, damping: 30 },
};
