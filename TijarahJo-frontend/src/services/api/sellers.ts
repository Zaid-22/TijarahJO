import { SellerProfileResponse } from "../../types/api";
import { apiRequest } from "./client";

export const sellersApi = {
  getSellerProfile: async (
    sellerId: string,
  ): Promise<SellerProfileResponse | null> => {
    const normalizedSellerId = String(sellerId).trim();
    if (!normalizedSellerId) {
      return null;
    }

    const backendResponse = await apiRequest<SellerProfileResponse>(
      `/sellers/${normalizedSellerId}`,
      {
        method: "GET",
      },
    );

    if (backendResponse.success && backendResponse.data) {
      return backendResponse.data;
    }

    return null;
  },
};
