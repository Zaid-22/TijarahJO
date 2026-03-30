import { apiRequest, debugError } from "./client";
import { toCamelCaseKeys } from "./admin";

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

export const bannersApi = {
  /**
   * Fetch all active hero banners for the homepage
   */
  getActiveBanners: async (): Promise<BannerModel[]> => {
    try {
      const response = await apiRequest<HeroBannerListResult>("/banners", {
        method: "GET",
      });

      if (response.success && response.data) {
        const data = toCamelCaseKeys<HeroBannerListResult>(response.data);
        if (data.success && data.banners) {
          return data.banners;
        }
      }
      return [];
    } catch (error) {
      debugError("Failed to fetch active banners:", error);
      return [];
    }
  },
};
