import { toPositiveIntegerId } from "../../utils/idValidation";
import { apiRequest } from "./client";

type RawReview = {
  ReviewID?: unknown;
  reviewID?: unknown;
  ReviewerID?: unknown;
  reviewerID?: unknown;
  ReviewedUserID?: unknown;
  reviewedUserID?: unknown;
  Rating?: unknown;
  rating?: unknown;
  Comment?: unknown;
  comment?: unknown;
  Timestamp?: unknown;
  timestamp?: unknown;
};

type AddReviewResult = {
  success: boolean;
  message?: string;
  data?: RawReview;
};

export const reviewsApi = {
  getUserReviews: async (userId: string): Promise<RawReview[]> => {
    const normalizedUserId = toPositiveIntegerId(userId);
    if (!normalizedUserId) {
      return [];
    }

    const response = await apiRequest<RawReview[]>(
      `/reviews/user/${normalizedUserId}`,
      {
        method: "GET",
      },
    );

    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  },

  addReview: async (payload: {
    reviewedUserId: number;
    rating: number;
    comment: string;
  }): Promise<AddReviewResult> => {
    const reviewedUserId = toPositiveIntegerId(payload.reviewedUserId);
    if (!reviewedUserId) {
      return {
        success: false,
        message: "Invalid reviewed user ID",
      };
    }

    const normalizedComment = payload.comment.trim();
    if (!normalizedComment) {
      return {
        success: false,
        message: "Comment is required",
      };
    }

    const normalizedRating = Math.max(
      1,
      Math.min(5, Math.round(payload.rating)),
    );

    const response = await apiRequest<RawReview>("/reviews", {
      method: "POST",
      body: JSON.stringify({
        ReviewID: null,
        ReviewerID: 0,
        ReviewedUserID: reviewedUserId,
        Rating: normalizedRating,
        Comment: normalizedComment,
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
