import { apiRequest, debugError } from "./client";
import { normalizeBannerImageUrl, type BannerModel } from "./banners";
import { toCamelCaseKeys } from "./admin";

/** Payload shape for creating or updating a hero banner. */
export type BannerPayload = {
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

export type BannerMutationResult = {
  success: boolean;
  message?: string;
};

export type BannerImageUploadResult = {
  success: boolean;
  url?: string;
  message?: string;
};

type GetBannersResponse = {
  success: boolean;
  banners: BannerModel[];
};

export const adminBannersApi = {
  getBanners: async (): Promise<BannerModel[]> => {
    try {
      const response = await apiRequest<GetBannersResponse>("/admin/banners", {
        method: "GET",
      });
      if (response.success && response.data) {
        const data = toCamelCaseKeys<GetBannersResponse>(response.data);
        if (data.success) {
          return (data.banners || []).map((banner) => ({
            ...banner,
            imageUrl: normalizeBannerImageUrl(banner.imageUrl),
          }));
        }
      }
      return [];
    } catch (error) {
      debugError("adminApi.getBanners", error);
      return [];
    }
  },

  createBanner: async (
    bannerData: BannerPayload,
  ): Promise<BannerMutationResult> => {
    try {
      const response = await apiRequest("/admin/banners", {
        method: "POST",
        body: JSON.stringify(bannerData),
      });
      if (response.success) {
        return { success: true };
      }

      return {
        success: false,
        message: response.error?.message || "Failed to add banner",
      };
    } catch (error) {
      debugError("adminApi.createBanner", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to add banner",
      };
    }
  },

  updateBanner: async (
    id: number,
    bannerData: Partial<BannerPayload>,
  ): Promise<BannerMutationResult> => {
    try {
      const response = await apiRequest(`/admin/banners/${id}`, {
        method: "PUT",
        body: JSON.stringify(bannerData),
      });
      if (response.success) {
        return { success: true };
      }

      return {
        success: false,
        message: response.error?.message || "Failed to update banner",
      };
    } catch (error) {
      debugError("adminApi.updateBanner", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update banner",
      };
    }
  },

  deleteBanner: async (id: number): Promise<boolean> => {
    try {
      const response = await apiRequest(`/admin/banners/${id}`, {
        method: "DELETE",
      });
      return response.success;
    } catch (error) {
      debugError("adminApi.deleteBanner", error);
      return false;
    }
  },

  toggleBannerActive: async (id: number): Promise<boolean> => {
    try {
      const response = await apiRequest(`/admin/banners/${id}/toggle`, {
        method: "PATCH",
      });
      return response.success;
    } catch (error) {
      debugError("adminApi.toggleBannerActive", error);
      return false;
    }
  },

  uploadBannerImage: async (file: File): Promise<BannerImageUploadResult> => {
    try {
      const formData = new FormData();
      formData.append("File", file, file.name);

      const response = await apiRequest<{ Url?: string; url?: string }>(
        "/admin/banners/upload-image",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.success) {
        return {
          success: false,
          message: response.error?.message || "Failed to upload banner image",
        };
      }

      const url = response.data?.Url?.trim() || response.data?.url?.trim();
      if (!url) {
        return {
          success: false,
          message: "Banner image upload did not return a URL",
        };
      }

      return {
        success: true,
        url: normalizeBannerImageUrl(url),
      };
    } catch (error) {
      debugError("adminApi.uploadBannerImage", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to upload banner image",
      };
    }
  },
};
