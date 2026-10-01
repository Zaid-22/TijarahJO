import { STORAGE_KEYS } from "../../../constants";
import {
  HERO_COLOR_TOKENS,
  resolveTailwindUtilityColor,
} from "../../../shared/design/colorTokens";

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

  return (
    HERO_COLOR_TOKENS[normalized] || resolveTailwindUtilityColor(normalized)
  );
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
