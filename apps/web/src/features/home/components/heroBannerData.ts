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

const DEFAULT_BANNERS: HeroBanner[] = [
  {
    id: "banner-1",
    title: "Buy and Sell Easily",
    titleAr: "اشتري وبيع بسهولة",
    subtitle: "Join Jordan's largest marketplace today.",
    subtitleAr: "انضم إلى أكبر سوق إلكتروني في الأردن اليوم.",
    buttonText: "Start Now",
    buttonTextAr: "ابدأ الآن",
    imageUrl: "/banners/asset-slide-1.webp",
    imageSrcSet: "/banners/asset-slide-1-360w.webp 360w, /banners/asset-slide-1.webp 640w",
    pngFallbackUrl: "/banners/asset-slide-1.png",
    bgClass: "bg-sky-50",
    textClass: "text-slate-900",
    altText: "Buy and Sell Easily in Jordan",
    altTextAr: "اشتري وبيع بسهولة في الأردن",
    linkUrl: "/posts",
    isActive: true,
    order: 0,
  },
  {
    id: "banner-2",
    title: "Premium Electronics",
    titleAr: "إلكترونيات مميزة",
    subtitle: "Up to 50% off on top tech brands.",
    subtitleAr: "خصومات تصل إلى 50٪ على أفضل العلامات التجارية.",
    buttonText: "Shop Deals",
    buttonTextAr: "تسوق العروض",
    imageUrl: "/banners/asset-slide-2.webp",
    imageSrcSet: "/banners/asset-slide-2-360w.webp 360w, /banners/asset-slide-2.webp 640w",
    pngFallbackUrl: "/banners/asset-slide-2.png",
    bgClass: "bg-slate-900",
    textClass: "text-white",
    altText: "Electronics Deals",
    altTextAr: "عروض الإلكترونيات",
    linkUrl: "/category/Electronics",
    isActive: true,
    order: 1,
  },
  {
    id: "banner-3",
    title: "Refresh Your Home",
    titleAr: "جدد بيتك",
    subtitle: "Modern furniture for every room.",
    subtitleAr: "أثاث عصري لكل غرفة.",
    buttonText: "Explore Furniture",
    buttonTextAr: "استكشف الأثاث",
    imageUrl: "/banners/asset-slide-3.webp",
    imageSrcSet: "/banners/asset-slide-3-360w.webp 360w, /banners/asset-slide-3.webp 640w",
    pngFallbackUrl: "/banners/asset-slide-3.png",
    bgClass: "bg-amber-50",
    textClass: "text-amber-950",
    altText: "Home and Furniture",
    altTextAr: "المنزل والأثاث",
    linkUrl: "/category/Furniture",
    isActive: true,
    order: 2,
  },
];

// v2: bumped to bust stale localStorage cache that contained broken linkUrls
const BANNERS_STORAGE_KEY =
  STORAGE_KEYS.SETTINGS_PREFERENCES.replace("settings", "hero-banners-v2");





export function getAllHeroBanners(): HeroBanner[] {
  try {
    const stored = localStorage.getItem(BANNERS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as HeroBanner[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => a.order - b.order);
      }
    }
  } catch {
    // fall through
  }

  return [...DEFAULT_BANNERS];
}


