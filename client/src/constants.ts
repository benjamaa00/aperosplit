import type { Member } from "./types";

export const CATEGORY_SECTIONS = [
  {
    title: "Nourriture et boissons",
    emoji: "🍽️",
    items: [
      { name: "Courses", emoji: "🛒" },
      { name: "Restaurants", emoji: "🍽️" },
      { name: "Café", emoji: "☕" },
      { name: "Livraison", emoji: "🛵" },
    ],
  },
  {
    title: "Transport",
    emoji: "🚗",
    items: [
      { name: "Voiture", emoji: "🚗" },
      { name: "Transports en commun", emoji: "🚆" },
      { name: "Taxi", emoji: "🚕" },
      { name: "Carburant", emoji: "⛽" },
    ],
  },
  {
    title: "Logement",
    emoji: "🏠",
    items: [
      { name: "Loyer", emoji: "🏠" },
      { name: "Crédit immobilier", emoji: "🏡" },
      { name: "Charges", emoji: "💡" },
      { name: "Internet", emoji: "📡" },
      { name: "Réparations", emoji: "🔧" },
      { name: "Meubles", emoji: "🛋️" },
    ],
  },
  {
    title: "Shopping",
    emoji: "🛍️",
    items: [
      { name: "Vêtements", emoji: "👕" },
      { name: "Électronique", emoji: "💻" },
      { name: "Soins personnels", emoji: "🧴" },
    ],
  },
  {
    title: "Loisirs",
    emoji: "🎮",
    items: [
      { name: "Abonnements", emoji: "📺" },
      { name: "Cinéma", emoji: "🎬" },
      { name: "Jeux vidéo", emoji: "🎮" },
      { name: "Loisirs", emoji: "🎨" },
    ],
  },
  {
    title: "Santé",
    emoji: "🏥",
    items: [
      { name: "Médecin", emoji: "🩺" },
      { name: "Médicaments", emoji: "💊" },
      { name: "Salle de sport", emoji: "🏋️" },
      { name: "Assurance", emoji: "🛡️" },
    ],
  },
  {
    title: "Éducation",
    emoji: "🎓",
    items: [
      { name: "Cours", emoji: "📚" },
      { name: "Livres", emoji: "📖" },
      { name: "Frais de scolarité", emoji: "🎓" },
    ],
  },
  {
    title: "Voyages",
    emoji: "✈️",
    items: [
      { name: "Hôtels", emoji: "🏨" },
      { name: "Vols", emoji: "✈️" },
      { name: "Location de voiture", emoji: "🚙" },
    ],
  },
  {
    title: "Autres",
    emoji: "📦",
    items: [
      { name: "Dons caritatifs", emoji: "💖" },
      { name: "Cadeaux", emoji: "🎁" },
      { name: "Animaux", emoji: "🐾" },
      { name: "Autres", emoji: "📦" },
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
