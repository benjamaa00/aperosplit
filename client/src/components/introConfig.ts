import { Car, Gamepad2, House, Plane, Receipt, ShoppingBag, Utensils } from "lucide-react";
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

export interface CategoryOrbConfig {
  label: string;
  icon: LucideIcon;
  x: number;
  y: number;
  size: number;
  floatDuration: number;
  floatDelay: number;
  startIndex: number;
  swapInterval: number;
}

export const CATEGORY_ORBS: CategoryOrbConfig[] = [
  { label: "Transport", icon: Car, x: 0, y: -86, size: 48, floatDuration: 7.2, floatDelay: -2.0, startIndex: 0, swapInterval: 4200 },
  { label: "Voyage", icon: Plane, x: 100, y: -56, size: 48, floatDuration: 6.4, floatDelay: -3.5, startIndex: 3, swapInterval: 4700 },
  { label: "Shopping", icon: ShoppingBag, x: 126, y: 6, size: 48, floatDuration: 8.1, floatDelay: -1.0, startIndex: 6, swapInterval: 5200 },
  { label: "Loisirs", icon: Gamepad2, x: 98, y: 60, size: 42, floatDuration: 6.9, floatDelay: -4.2, startIndex: 9, swapInterval: 5600 },
  { label: "Logement", icon: House, x: 0, y: 88, size: 42, floatDuration: 7.8, floatDelay: -5.0, startIndex: 1, swapInterval: 6100 },
  { label: "Nourriture", icon: Utensils, x: -100, y: 60, size: 42, floatDuration: 6.1, floatDelay: -0.7, startIndex: 4, swapInterval: 6500 },
  { label: "Factures", icon: Receipt, x: -126, y: 6, size: 36, floatDuration: 7.5, floatDelay: -2.8, startIndex: 7, swapInterval: 6900 },
];
