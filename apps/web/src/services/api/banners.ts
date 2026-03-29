import { apiRequest, debugError } from "./client";

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
        // Handle PascalCase from backend
        const isSuccess = response.data.success || (response.data as any).Success;
        const items = response.data.banners || (response.data as any).Banners;
        if (isSuccess && items) {
          return items.map((b: any) => {
            // ensure camelCase keys since Backend might return PascalCase if naming policy is missing
            const camelCaseBanner: any = {};
            for (const [key, value] of Object.entries(b)) {
              const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
              camelCaseBanner[camelKey] = value;
            }
            return camelCaseBanner as BannerModel;
          });
        }
      }
      return [];
    } catch (error) {
      debugError("Failed to fetch active banners:", error);
      return [];
    }
  },
};
