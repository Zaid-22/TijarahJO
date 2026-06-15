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

// In-flight deduplication — prevents concurrent duplicate requests to the seller profile endpoint
const _sellerProfileInflight: Map<string, Promise<SellerProfileResponse | null>> = new Map();

export const sellersApi = {
  getSellerProfile: async (
    sellerId: string,
  ): Promise<SellerProfileResponse | null> => {
    const normalizedSellerId = String(sellerId).trim();
    if (!normalizedSellerId) {
      return null;
    }

    let inflight = _sellerProfileInflight.get(normalizedSellerId);
    if (inflight) {
      return inflight;
    }

    const encodedSellerId = encodeURIComponent(normalizedSellerId);
    inflight = (async () => {
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
    })().finally(() => {
      _sellerProfileInflight.delete(normalizedSellerId);
    });

    _sellerProfileInflight.set(normalizedSellerId, inflight);
    return inflight;
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

