import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../services/api";
import { transformPostModelToPost } from "../../../services/api/posts/mappers";
import type { RawPost } from "../../../services/api/posts/types";
import { Post } from "../../../types";
import { toPositiveIntegerId } from "../../../utils/idValidation";
import { normalizeSellerDisplayName } from "../../../utils/sellerDisplayName";
import { resolveUserDisplayName } from "../../../utils/userDisplayName";

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function isActiveListing(post: unknown): boolean {
  const row = toRecord(post);
  const status = String(row.status ?? row.Status ?? "").toUpperCase();
  const isDeleted = Boolean(row.isDeleted ?? row.IsDeleted ?? false);
  return status === "ACTIVE" && !isDeleted;
}

function normalizeListingToPost(
  post: unknown,
  fallbackIndex: number,
  sellerName: string,
  sellerId: string,
  fallbackLocation: string,
): Post {
  const normalized = transformPostModelToPost(
    post as RawPost,
    [],
    fallbackIndex,
  );
  const normalizedSeller = String(normalized.seller || "").trim();
  const normalizedSellerId = String(normalized.sellerId || "").trim();
  const normalizedLocation = String(normalized.location || "").trim();

  return {
    ...normalized,
    seller: normalizedSeller.length > 0 ? normalizedSeller : sellerName,
    sellerId: normalizedSellerId.length > 0 ? normalizedSellerId : sellerId,
    location: normalizedLocation.length > 0 ? normalizedLocation : fallbackLocation,
  };
}

interface SellerReview {
  reviewID: number | string;
  reviewerID: number;
  reviewerName: string;
  rating: number;
  comment: string;
  timestamp: string;
}

interface SellerProfileState {
  name: string;
  joinDate: string;
  location: string;
  avatar?: string;
}

export function useSellerProfileData(userId: string | undefined) {
  const [activeListings, setActiveListings] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sellerProfile, setSellerProfile] = useState<SellerProfileState | null>(
    null,
  );

  const reload = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setActiveListings([]);
    setReviews([]);
    setSellerProfile(null);

    try {
      const sellerResponse = await api.sellers.getSellerProfile(String(userId));
      if (sellerResponse?.seller) {
        const seller = sellerResponse.seller;
        const city = seller?.city;
        const area = seller?.area;
        const location = [area, city].filter(Boolean).join(", ") || "Amman, Jordan";
        const sellerName = normalizeSellerDisplayName(
          seller.name,
          String(seller?.id || userId),
        );

        setSellerProfile({
          name: sellerName,
          joinDate: seller.joinedDate || "2024",
          location,
          avatar: seller.avatar,
        });

        const activePosts = (sellerResponse.posts || [])
          .filter(isActiveListing)
          .map((post, index: number) =>
            normalizeListingToPost(
              post,
              index,
              sellerName,
              String(seller?.id || userId),
              location,
            ),
          );
        setActiveListings(activePosts);
      } else {
        const sellerUser = await api.users.getUser(String(userId));
        let fallbackSellerName = `User ${userId}`;
        let fallbackLocation = "Amman, Jordan";
        if (sellerUser) {
          const sellerRow = toRecord(sellerUser);
          const city = String(sellerRow.city ?? sellerRow.City ?? "").trim();
          const area = String(sellerRow.area ?? sellerRow.Area ?? "").trim();
          const location = [area, city].filter(Boolean).join(", ") || "Amman, Jordan";

          fallbackSellerName = normalizeSellerDisplayName(
            resolveUserDisplayName(sellerRow, String(userId)),
            String(userId),
          );
          fallbackLocation = location;
          setSellerProfile({
            name: fallbackSellerName,
            joinDate: String(sellerRow.joinedAt ?? "2024"),
            location,
            avatar: String(sellerRow.avatar ?? ""),
          });
        }

        const userPosts = await api.posts.getUserPosts(String(userId));
        const activePosts = userPosts
          .filter(isActiveListing)
          .map((post: Post, index: number) =>
            normalizeListingToPost(
              post,
              index,
              fallbackSellerName,
              String(userId),
              fallbackLocation,
            ),
          );
        setActiveListings(activePosts);
      }

      const reviewList = await api.reviews.getUserReviews(String(userId));
      const normalizedReviews = reviewList.map((review: unknown, index: number) => {
        const reviewRow = toRecord(review);
        const reviewIdRaw = reviewRow.ReviewID ?? reviewRow.reviewID;
        const reviewId =
          typeof reviewIdRaw === "number" && Number.isFinite(reviewIdRaw)
            ? Math.trunc(reviewIdRaw)
            : typeof reviewIdRaw === "string" && reviewIdRaw.trim().length > 0
              ? reviewIdRaw.trim()
              : `review-${index}`;
        const reviewerId =
          toPositiveIntegerId(reviewRow.ReviewerID ?? reviewRow.reviewerID) ?? 0;
        const rawRating = Number(reviewRow.Rating ?? reviewRow.rating ?? 0);
        const safeRating =
          Number.isFinite(rawRating) && rawRating > 0
            ? Math.min(5, Math.max(1, Math.round(rawRating)))
            : 0;
        const rawTimestamp = reviewRow.Timestamp ?? reviewRow.timestamp;
        const parsedTimestamp =
          typeof rawTimestamp === "string" ||
          typeof rawTimestamp === "number" ||
          rawTimestamp instanceof Date
            ? new Date(rawTimestamp)
            : null;
        const timestamp =
          parsedTimestamp && !Number.isNaN(parsedTimestamp.getTime())
            ? parsedTimestamp.toISOString()
            : new Date().toISOString();

        return {
          reviewID: reviewId,
          reviewerID: reviewerId,
          reviewerName: resolveUserDisplayName(
            {
              name: reviewRow.ReviewerName ?? reviewRow.reviewerName,
              email: reviewRow.ReviewerEmail ?? reviewRow.reviewerEmail,
            },
            reviewerId,
          ),
          rating: safeRating,
          comment: String(reviewRow.Comment ?? reviewRow.comment ?? ""),
          timestamp,
        };
      });
      setReviews(normalizedReviews);
    } catch {
      toast.error("Failed to load seller profile");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    activeListings,
    reviews,
    isLoading,
    sellerProfile,
    reload,
  };
}
