import { apiRequest } from "./client";

export const reviewsApi = {
  getUserReviews: async (userId: string): Promise<any[]> => {
    const response = await apiRequest<any[]>(`/reviews/user/${userId}`, {
      method: "GET",
    });

    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  },

  addReview: async (payload: {
    reviewedUserId: number;
    rating: number;
    comment: string;
  }): Promise<{ success: boolean; message?: string; data?: any }> => {
    const response = await apiRequest<any>("/reviews", {
      method: "POST",
      body: JSON.stringify({
        ReviewID: null,
        ReviewerID: 0,
        ReviewedUserID: payload.reviewedUserId,
        Rating: payload.rating,
        Comment: payload.comment,
        Timestamp: new Date().toISOString(),
      }),
    });

    if (response.success) {
      return { success: true, data: response.data };
    }

    return {
      success: false,
      message: response.error?.message || "Failed to submit review",
    };
  },
};
