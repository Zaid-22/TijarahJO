import { SellerProfileResponse } from "../../types/api";
import { apiRequest } from "./client";

interface TopSeller {
  id: string;
  name: string;
  phone: string;
  city: string;
  area: string;
  avatar: string;
  joinedDate: string;
  activeListingsCount: number;
  totalSalesCount: number;
  totalViews: number;
}

export const sellersApi = {
  getSellerProfile: async (
    sellerId: string,
  ): Promise<SellerProfileResponse | null> => {
    const normalizedSellerId = String(sellerId).trim();
    if (!normalizedSellerId) {
      return null;
    }

    const encodedSellerId = encodeURIComponent(normalizedSellerId);
    const backendResponse = await apiRequest<SellerProfileResponse>(
      `/sellers/${encodedSellerId}`,
      {
        method: "GET",
      },
    );

    if (backendResponse.success && backendResponse.data) {
      return backendResponse.data;
    }

    return null;
  },

  getTopSellers: async (take: number = 6): Promise<TopSeller[]> => {
    const backendResponse = await apiRequest<TopSeller[]>(
      `/sellers/top?take=${take}`,
      { method: "GET" },
    );

    if (backendResponse.success && backendResponse.data) {
      return Array.isArray(backendResponse.data)
        ? backendResponse.data
        : [];
    }

    return [];
  },
};

