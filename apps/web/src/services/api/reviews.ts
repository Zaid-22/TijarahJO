import { toPositiveIntegerId } from "../../utils/idValidation";
import { apiRequest } from "./client";
import {
  parseRawReview,
  parseRawReviewsCollection,
} from "./schemas/reviewSchema";

export type RawReview = {
  ReviewID?: unknown;
  reviewID?: unknown;
  ReviewerID?: unknown;
  reviewerID?: unknown;
  ReviewerName?: unknown;
  reviewerName?: unknown;
  ReviewerAvatar?: unknown;
  reviewerAvatar?: unknown;
  reviewer?: { name?: string };
  Reviewer?: { Name?: string };
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

    const response = await apiRequest<unknown>(
      `/reviews/user/${normalizedUserId}`,
      {
        method: "GET",
      },
    );

    if (response.success) {
      return parseRawReviewsCollection(response.data);
    }

    return [];
  },

  /**
   * Fetch aggregated rating stats for a single seller using the batch endpoint.
   * More efficient than getUserReviews — one DB round-trip, no raw review transfer.
   */
  getSellerRating: async (
    userId: string,
  ): Promise<{ averageRating: number; reviewCount: number }> => {
    const normalizedUserId = toPositiveIntegerId(userId);
    if (!normalizedUserId) {
      return { averageRating: 0, reviewCount: 0 };
    }

    const response = await apiRequest<Record<string, { AverageRating: number; ReviewCount: number }>>(
      `/reviews/ratings?userIds=${encodeURIComponent(String(normalizedUserId))}`,
      { method: "GET" },
    );

    if (response.success && response.data && typeof response.data === "object") {
      const stat = response.data[String(normalizedUserId)];
      if (stat) {
        const avg = Number(stat.AverageRating ?? 0);
        const count = Number(stat.ReviewCount ?? 0);
        return {
          averageRating: Number.isFinite(avg) ? Math.min(5, Math.max(0, avg)) : 0,
          reviewCount: Number.isFinite(count) && count > 0 ? count : 0,
        };
      }
    }

    return { averageRating: 0, reviewCount: 0 };
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

    const response = await apiRequest<unknown>("/reviews", {
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
      const parsedReview = parseRawReview(response.data);
      if (!parsedReview) {
        return {
          success: false,
          message: "Invalid review response",
        };
      }

      return { success: true, data: parsedReview };
    }

    return {
      success: false,
      message: response.error?.message || "Failed to submit review",
    };
  },
};
