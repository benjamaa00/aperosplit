import { Car, Gamepad2, Plane, Receipt, ShoppingBag, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const CENTER_IMAGE = "/categories/aperosplit_icon.png";

export const ORB_IMAGES = [
  CENTER_IMAGE,
  "/categories/aperosplit_bell_final.png",
  "/categories/aperosplit_calendar_final.png",
  "/categories/aperosplit_card_final.png",
  "/categories/aperosplit_cocktail_final.png",
  "/categories/aperosplit_gift_final.png",
  "/categories/aperosplit_group_final.png",
  "/categories/aperosplit_piggy_bank_final.png",
  "/categories/aperosplit_receipt_final.png",
  "/categories/aperosplit_rocket_final.png",
  "/categories/aperosplit_shopping_bag_final.png",
];

/**
 * Composition iCloud-classique, non alignée :
 * une grande sphère/avatar centrale dominante, entourée de satellites
 * orbitaux de tailles différentes. Les positions et tailles sont des
 * pourcentages relatifs au conteneur (intro-constellation, 610×513) :
 * left/top en %, transform: translate(-50%, -50%).
 */

export interface CenterOrbConfig {
  /** centre X en % de la largeur du conteneur */
  x: number;
  /** centre Y en % de la hauteur du conteneur */
  y: number;
  /** diamètre en % de la largeur du conteneur */
  size: number;
  zIndex: number;
}

export const CENTER_ORB: CenterOrbConfig = {
  x: 50,
  y: 53,
  size: 44,
  zIndex: 5,
};

export interface CategoryOrbConfig {
  label: string;
  icon: LucideIcon;
  x: number;
  y: number;
  size: number;
  zIndex: number;
  floatDuration: number;
  floatDelay: number;
  startIndex: number;
  swapInterval: number;
}

export const CATEGORY_ORBS: CategoryOrbConfig[] = [
  { label: "Voyage", icon: Plane, x: 52, y: 15.5, size: 18, zIndex: 1, floatDuration: 7.2, floatDelay: -2.0, startIndex: 3, swapInterval: 4700 },
  { label: "Transport", icon: Car, x: 22, y: 39, size: 25, zIndex: 1, floatDuration: 6.4, floatDelay: -3.5, startIndex: 0, swapInterval: 4200 },
  { label: "Shopping", icon: ShoppingBag, x: 84, y: 55, size: 26, zIndex: 1, floatDuration: 8.1, floatDelay: -1.0, startIndex: 6, swapInterval: 5200 },
  { label: "Loisirs", icon: Gamepad2, x: 18, y: 58, size: 8.5, zIndex: 1, floatDuration: 6.9, floatDelay: -4.2, startIndex: 9, swapInterval: 5600 },
  { label: "Nourriture", icon: Utensils, x: 21.5, y: 67.5, size: 12, zIndex: 1, floatDuration: 6.1, floatDelay: -0.7, startIndex: 4, swapInterval: 6500 },
  { label: "Factures", icon: Receipt, x: 56, y: 89, size: 21, zIndex: 2, floatDuration: 7.5, floatDelay: -2.8, startIndex: 7, swapInterval: 6900 },
];

/**
 * Cycle cinématique de l'intro (se répète toutes les ~8,8 s) :
 *  1. "orbit"   — les satellites tournent très lentement autour de la sphère
 *  2. "converge"— ils rentrent en douceur au centre de la sphère principale
 *  3. "name"    — la sphère disparaît complètement ; le titre « AperoSplit »
 *                monte depuis le bas et s'affiche en grand et coloré (2,3 s)
 *  4. "return"  — le titre redescend, la sphère réapparaît en douceur et les
 *                satellites ressortent smooth ; le cycle recommence.
 */
export type IntroPhase = "orbit" | "converge" | "name" | "return";

export const INTRO_CYCLE_MS = 8800;

/** moments des phases (ms) dans le cycle, à partir du début du cycle */
export const INTRO_PHASE_AT = {
  converge: 3600,
  name: 5000,
  return: 7300,
} as const;

export const INTRO_MOTION = {
  /** durée d'un tour complet de rotation lente (s) */
  spinDurationSec: 40,
  convergeMs: 1400,
  nameMs: 2300,
  returnMs: 1400,
  /** durée de la disparition de la sphère pendant le nom */
  sphereFadeOutMs: 1000,
  /** durée de la montée du titre vers le centre (smooth glide) */
  nameRiseMs: 800,
  /** échelle du titre affiché « en grandeur » */
  titleScale: 1.7,
} as const;
