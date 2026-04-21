import { STORAGE_KEYS } from "../../../constants";

export interface HeroBanner {
  id: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  buttonText: string;
  buttonTextAr: string;
  imageUrl: string;
  /** WebP srcSet for responsive delivery (e.g. "url-360w.webp 360w, url.webp 640w") */
  imageSrcSet?: string;
  /** PNG fallback for browsers that don't support WebP */
  pngFallbackUrl?: string;
  bgClass: string;
  textClass: string;
  altText: string;
  altTextAr: string;
  linkUrl?: string;
  isActive: boolean;
  order: number;
}

const TAILWIND_COLOR_PALETTE: Record<string, Record<string, string>> = {
  slate: {
    "50": "#f8fafc",
    "100": "#f1f5f9",
    "200": "#e2e8f0",
    "300": "#cbd5e1",
    "400": "#94a3b8",
    "500": "#64748b",
    "600": "#475569",
    "700": "#334155",
    "800": "#1e293b",
    "900": "#0f172a",
    "950": "#020617",
  },
  gray: {
    "50": "#f9fafb",
    "100": "#f3f4f6",
    "200": "#e5e7eb",
    "300": "#d1d5db",
    "400": "#9ca3af",
    "500": "#6b7280",
    "600": "#4b5563",
    "700": "#374151",
    "800": "#1f2937",
    "900": "#111827",
    "950": "#030712",
  },
  red: {
    "50": "#fef2f2",
    "100": "#fee2e2",
    "200": "#fecaca",
    "300": "#fca5a5",
    "400": "#f87171",
    "500": "#ef4444",
    "600": "#dc2626",
    "700": "#b91c1c",
    "800": "#991b1b",
    "900": "#7f1d1d",
    "950": "#450a0a",
  },
  amber: {
    "50": "#fffbeb",
    "100": "#fef3c7",
    "200": "#fde68a",
    "300": "#fcd34d",
    "400": "#fbbf24",
    "500": "#f59e0b",
    "600": "#d97706",
    "700": "#b45309",
    "800": "#92400e",
    "900": "#78350f",
    "950": "#451a03",
  },
  yellow: {
    "50": "#fefce8",
    "100": "#fef9c3",
    "200": "#fef08a",
    "300": "#fde047",
    "400": "#facc15",
    "500": "#eab308",
    "600": "#ca8a04",
    "700": "#a16207",
    "800": "#854d0e",
    "900": "#713f12",
    "950": "#422006",
  },
  green: {
    "50": "#f0fdf4",
    "100": "#dcfce7",
    "200": "#bbf7d0",
    "300": "#86efac",
    "400": "#4ade80",
    "500": "#22c55e",
    "600": "#16a34a",
    "700": "#15803d",
    "800": "#166534",
    "900": "#14532d",
    "950": "#052e16",
  },
  emerald: {
    "50": "#ecfdf5",
    "100": "#d1fae5",
    "200": "#a7f3d0",
    "300": "#6ee7b7",
    "400": "#34d399",
    "500": "#10b981",
    "600": "#059669",
    "700": "#047857",
    "800": "#065f46",
    "900": "#064e3b",
    "950": "#022c22",
  },
  sky: {
    "50": "#f0f9ff",
    "100": "#e0f2fe",
    "200": "#bae6fd",
    "300": "#7dd3fc",
    "400": "#38bdf8",
    "500": "#0ea5e9",
    "600": "#0284c7",
    "700": "#0369a1",
    "800": "#075985",
    "900": "#0c4a6e",
    "950": "#082f49",
  },
  blue: {
    "50": "#eff6ff",
    "100": "#dbeafe",
    "200": "#bfdbfe",
    "300": "#93c5fd",
    "400": "#60a5fa",
    "500": "#3b82f6",
    "600": "#2563eb",
    "700": "#1d4ed8",
    "800": "#1e40af",
    "900": "#1e3a8a",
    "950": "#172554",
  },
  indigo: {
    "50": "#eef2ff",
    "100": "#e0e7ff",
    "200": "#c7d2fe",
    "300": "#a5b4fc",
    "400": "#818cf8",
    "500": "#6366f1",
    "600": "#4f46e5",
    "700": "#4338ca",
    "800": "#3730a3",
    "900": "#312e81",
    "950": "#1e1b4b",
  },
  purple: {
    "50": "#faf5ff",
    "100": "#f3e8ff",
    "200": "#e9d5ff",
    "300": "#d8b4fe",
    "400": "#c084fc",
    "500": "#a855f7",
    "600": "#9333ea",
    "700": "#7e22ce",
    "800": "#6b21a8",
    "900": "#581c87",
    "950": "#3b0764",
  },
  pink: {
    "50": "#fdf2f8",
    "100": "#fce7f3",
    "200": "#fbcfe8",
    "300": "#f9a8d4",
    "400": "#f472b6",
    "500": "#ec4899",
    "600": "#db2777",
    "700": "#be185d",
    "800": "#9d174d",
    "900": "#831843",
    "950": "#500724",
  },
};

const HERO_COLOR_TOKENS: Record<string, string> = {
  "bg-background": "hsl(var(--background))",
  "text-foreground": "hsl(var(--foreground))",
  "bg-white": "#ffffff",
  "text-white": "#ffffff",
  "bg-black": "#000000",
  "text-black": "#000000",
  transparent: "transparent",
  "bg-transparent": "transparent",
  "text-transparent": "transparent",
};

function resolveTailwindColorToken(value: string): string | undefined {
  const match = value.match(/^(?:bg|text)-([a-z]+)-(\d{2,3})$/);
  if (!match) {
    return undefined;
  }

  const [, palette, shade] = match;
  return TAILWIND_COLOR_PALETTE[palette]?.[shade];
}

export function resolveBannerColor(value: string): string | undefined {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  if (
    /^#[0-9A-Fa-f]{3,8}$/.test(normalized) ||
    /^(?:rgb|hsl|oklch|color)\(/i.test(normalized) ||
    /^var\(/i.test(normalized) ||
    /^linear-gradient\(/i.test(normalized)
  ) {
    return normalized;
  }

  return HERO_COLOR_TOKENS[normalized] || resolveTailwindColorToken(normalized);
}

export function resolveHeroBannerMedia(imageUrl: string): Pick<
  HeroBanner,
  "imageSrcSet" | "pngFallbackUrl"
> {
  const normalizedImageUrl = imageUrl.trim();
  const localBannerMatch = normalizedImageUrl.match(
    /^\/banners\/(asset-slide-\d+)\.webp$/i,
  );

  if (!localBannerMatch) {
    return {};
  }

  const assetName = localBannerMatch[1];

  return {
    imageSrcSet: `/banners/${assetName}-360w.webp 360w, /banners/${assetName}.webp 640w`,
    pngFallbackUrl: `/banners/${assetName}.png`,
  };
}



// v2: bumped to bust stale localStorage cache that contained broken linkUrls
const BANNERS_STORAGE_KEY =
  STORAGE_KEYS.SETTINGS_PREFERENCES.replace("settings", "hero-banners-v2");

function normalizeStoredBanners(value: unknown): HeroBanner[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  return value
    .filter((banner): banner is HeroBanner => {
      return (
        typeof banner === "object" &&
        banner !== null &&
        typeof banner.id === "string" &&
        typeof banner.title === "string" &&
        typeof banner.titleAr === "string" &&
        typeof banner.subtitle === "string" &&
        typeof banner.subtitleAr === "string" &&
        typeof banner.buttonText === "string" &&
        typeof banner.buttonTextAr === "string" &&
        typeof banner.imageUrl === "string" &&
        typeof banner.bgClass === "string" &&
        typeof banner.textClass === "string" &&
        typeof banner.altText === "string" &&
        typeof banner.altTextAr === "string" &&
        typeof banner.isActive === "boolean" &&
        typeof banner.order === "number"
      );
    })
    .sort((a, b) => a.order - b.order);
}

export function getAllHeroBanners(): HeroBanner[] {
  try {
    const stored = localStorage.getItem(BANNERS_STORAGE_KEY);
    if (stored) {
      const parsed = normalizeStoredBanners(JSON.parse(stored));
      if (parsed && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fall through
  }

  return [];
}

export function saveHeroBanners(banners: HeroBanner[]): void {
  try {
    const normalizedBanners = normalizeStoredBanners(banners);
    if (!normalizedBanners || normalizedBanners.length === 0) {
      return;
    }

    localStorage.setItem(
      BANNERS_STORAGE_KEY,
      JSON.stringify(normalizedBanners),
    );
  } catch {
    // Ignore storage failures so the homepage never breaks on cache writes.
  }
}

export function clearSavedHeroBanners(): void {
  try {
    localStorage.removeItem(BANNERS_STORAGE_KEY);
  } catch {
    // Ignore storage failures so admin banner updates never fail on cache cleanup.
  }
}
