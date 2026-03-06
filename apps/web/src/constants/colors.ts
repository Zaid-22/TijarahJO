/**
 * Brand colors — sourced from CSS custom properties in globals.css.
 * These constants exist for JS contexts where CSS vars aren't available
 * (e.g. canvas drawing, SVG generation). For all other cases, use
 * Tailwind's `bg-primary`, `text-primary`, etc.
 *
 * @deprecated Prefer CSS-based `var(--primary)` or Tailwind classes.
 */
export const COLORS = {
  PRIMARY: "#0A4ABF",
  PRIMARY_HOVER: "#083A99",
  SECONDARY: "#3E7EFF",
};

export const CATEGORY_COLOR_HEX = {
  PRIMARY: "#0A4ABF",
  PRIMARY_HOVER: "#083A99",
  SECONDARY: "#3E7EFF",
  BLUE_600: "#2563EB",
  BLUE_700: "#1D4ED8",
  SKY_500: "#0EA5E9",
  CYAN_500: "#06B6D4",
  EMERALD_500: "#10B981",
  GREEN_500: "#22C55E",
  LIME_500: "#84CC16",
  YELLOW_500: "#EAB308",
  AMBER_500: "#F59E0B",
  ORANGE_500: "#F97316",
  RED_500: "#EF4444",
  PINK_500: "#EC4899",
  VIOLET_500: "#8B5CF6",
  PURPLE_500: "#A855F7",
  GRAY_500: "#6B7280",
  GRAY_900: "#111827",
} as const;
