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
    imageUrl: "/banners/asset-slide-1.png",
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
    imageUrl: "/banners/asset-slide-2.png",
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
    imageUrl: "/banners/asset-slide-3.png",
    bgClass: "bg-amber-50",
    textClass: "text-amber-950",
    altText: "Home and Furniture",
    altTextAr: "المنزل والأثاث",
    linkUrl: "/category/Furniture",
    isActive: true,
    order: 2,
  },
];

const BANNERS_STORAGE_KEY =
  STORAGE_KEYS.SETTINGS_PREFERENCES.replace("settings", "hero-banners");

export function getHeroBanners(): HeroBanner[] {
  try {
    const stored = localStorage.getItem(BANNERS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as HeroBanner[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((b) => b.isActive)
          .sort((a, b) => a.order - b.order);
      }
    }
  } catch {
    // fall through to defaults
  }

  return DEFAULT_BANNERS.filter((b) => b.isActive).sort(
    (a, b) => a.order - b.order,
  );
}

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

export function saveHeroBanners(banners: HeroBanner[]): void {
  localStorage.setItem(BANNERS_STORAGE_KEY, JSON.stringify(banners));
}

export function resetHeroBannersToDefaults(): void {
  localStorage.removeItem(BANNERS_STORAGE_KEY);
}
