import {
  Armchair,
  BookOpen,
  Camera,
  Car,
  Dumbbell,
  Gamepad2,
  Home,
  Monitor,
  Package,
  PawPrint,
  Refrigerator,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "../../types/api";
import type { Language } from "../../types";
import { CATEGORY_COLOR_HEX } from "../../constants/colors";

const DEFAULT_CATEGORY_TEXT_CLASS = "text-primary";
const DEFAULT_CATEGORY_BG_CLASS = "bg-primary";

const COLOR_CLASS_BY_HEX: Record<string, { text: string; bg: string }> = {
  [CATEGORY_COLOR_HEX.PRIMARY]: { text: "text-primary", bg: "bg-primary" },
  [CATEGORY_COLOR_HEX.PRIMARY_HOVER]: {
    text: "text-blue-800",
    bg: "bg-blue-800",
  },
  [CATEGORY_COLOR_HEX.SECONDARY]: {
    text: "text-secondary",
    bg: "bg-secondary",
  },
  [CATEGORY_COLOR_HEX.BLUE_600]: { text: "text-blue-600", bg: "bg-blue-600" },
  [CATEGORY_COLOR_HEX.BLUE_700]: { text: "text-blue-700", bg: "bg-blue-700" },
  [CATEGORY_COLOR_HEX.SKY_500]: { text: "text-sky-500", bg: "bg-sky-500" },
  [CATEGORY_COLOR_HEX.CYAN_500]: { text: "text-cyan-500", bg: "bg-cyan-500" },
  [CATEGORY_COLOR_HEX.EMERALD_500]: {
    text: "text-emerald-500",
    bg: "bg-emerald-500",
  },
  [CATEGORY_COLOR_HEX.GREEN_500]: {
    text: "text-green-500",
    bg: "bg-green-500",
  },
  [CATEGORY_COLOR_HEX.LIME_500]: { text: "text-lime-500", bg: "bg-lime-500" },
  [CATEGORY_COLOR_HEX.YELLOW_500]: {
    text: "text-yellow-500",
    bg: "bg-yellow-500",
  },
  [CATEGORY_COLOR_HEX.AMBER_500]: {
    text: "text-amber-500",
    bg: "bg-amber-500",
  },
  [CATEGORY_COLOR_HEX.ORANGE_500]: {
    text: "text-orange-500",
    bg: "bg-orange-500",
  },
  [CATEGORY_COLOR_HEX.RED_500]: { text: "text-red-500", bg: "bg-red-500" },
  [CATEGORY_COLOR_HEX.PINK_500]: { text: "text-pink-500", bg: "bg-pink-500" },
  [CATEGORY_COLOR_HEX.VIOLET_500]: {
    text: "text-violet-500",
    bg: "bg-violet-500",
  },
  [CATEGORY_COLOR_HEX.PURPLE_500]: {
    text: "text-purple-500",
    bg: "bg-purple-500",
  },
  [CATEGORY_COLOR_HEX.GRAY_500]: { text: "text-gray-500", bg: "bg-gray-500" },
  [CATEGORY_COLOR_HEX.GRAY_900]: { text: "text-gray-900", bg: "bg-gray-900" },
};

const categoryIconByName: Record<string, LucideIcon> = {
  camera: Camera,
  smartphone: Smartphone,
  monitor: Monitor,
  refrigerator: Refrigerator,
  armchair: Armchair,
  car: Car,
  "shopping-bag": ShoppingBag,
  sparkles: Sparkles,
  dumbbell: Dumbbell,
  "book-open": BookOpen,
  "gamepad-2": Gamepad2,
  home: Home,
  "paw-print": PawPrint,
  wrench: Wrench,
  package: Package,
  box: Package,
};

function normalizeIconKey(icon: string | undefined): string {
  if (!icon) {
    return "";
  }

  return icon
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function normalizeColorKey(color: string | undefined): string {
  return (color || "").trim().toUpperCase();
}

export function resolveCategoryIcon(icon: string | undefined): LucideIcon {
  const normalized = normalizeIconKey(icon);
  return categoryIconByName[normalized] || Package;
}

export function resolveCategoryTextClass(color: string | undefined): string {
  const colorKey = normalizeColorKey(color);
  return COLOR_CLASS_BY_HEX[colorKey]?.text || DEFAULT_CATEGORY_TEXT_CLASS;
}

export function resolveCategorySwatchClass(color: string | undefined): string {
  const colorKey = normalizeColorKey(color);
  return COLOR_CLASS_BY_HEX[colorKey]?.bg || DEFAULT_CATEGORY_BG_CLASS;
}

export function resolveCategoryName(
  category: Category,
  language: Language,
): string {
  if (language === "ar" && category.nameAr.trim().length > 0) {
    return category.nameAr;
  }

  return category.name;
}
