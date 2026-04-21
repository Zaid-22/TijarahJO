import { apiRequest, debugError } from "./client";
import { toCamelCaseKeys } from "./admin";
import { APP_CONFIG } from "../../constants/appConfig";

export type BannerModel = {
  bannerID: number;
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
  displayOrder: number;
};

export type HeroBannerListResult = {
  success: boolean;
  statusCode: number;
  message?: string;
  banners: BannerModel[];
};

export function normalizeBannerImageUrl(imageUrl: string): string {
  const trimmed = imageUrl.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("/uploads/")) {
    return `${APP_CONFIG.backendHostUrl}${trimmed}`;
  }

  if (trimmed.startsWith("uploads/")) {
    const backendHost = APP_CONFIG.backendHostUrl.endsWith("/")
      ? APP_CONFIG.backendHostUrl.slice(0, -1)
      : APP_CONFIG.backendHostUrl;
    return `${backendHost}/${trimmed}`;
  }

  return trimmed;
}

export const bannersApi = {
  /**
   * Fetch all active hero banners for the homepage
   */
  getActiveBanners: async (): Promise<BannerModel[] | null> => {
    try {
      const response = await apiRequest<HeroBannerListResult>("/banners", {
        method: "GET",
      });

      if (response.success && response.data) {
        const data = toCamelCaseKeys<HeroBannerListResult>(response.data);
        if (data.success && data.banners) {
          return data.banners.map((banner) => ({
            ...banner,
            imageUrl: normalizeBannerImageUrl(banner.imageUrl),
          }));
        }
      }
      return null;
    } catch (error) {
      debugError("Failed to fetch active banners:", error);
      return null;
    }
  },
};
