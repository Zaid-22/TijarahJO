import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  Calendar,
  Star,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../shared/ui/button";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { ProductCard } from "../features/marketplace/components/ProductCard";
import { Textarea } from "../shared/ui/textarea";
import { Product } from "../types";
import { normalizeSellerDisplayName } from "../utils/sellerDisplayName";
import { transformPostModelToProduct } from "../services/api/posts/mappers";
import type { RawPost } from "../services/api/posts/types";
import { resolveUserDisplayName } from "../utils/userDisplayName";
import { toPositiveIntegerId } from "../utils/idValidation";

function normalizeListingToProduct(
  post: unknown,
  fallbackIndex: number,
  sellerName: string,
  sellerId: string,
  fallbackLocation: string,
): Product {
  const normalized = transformPostModelToProduct(
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

export function SellerProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // const [seller, setSeller] = useState<any>(null);
  const [activeListings, setActiveListings] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sellerProfile, setSellerProfile] = useState<SellerProfileState | null>(
    null,
  );

  // Review Form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const loadData = useCallback(async () => {
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
            normalizeListingToProduct(
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
          .map((post: Product, index: number) =>
            normalizeListingToProduct(
              post,
              index,
              fallbackSellerName,
              String(userId),
              fallbackLocation,
            ),
          );
        setActiveListings(activePosts);
      }

      // Fetch Reviews
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
    } catch (e) {
      toast.error("Failed to load seller profile");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const submitReview = async () => {
    if (!isAuthenticated) return toast.error("Please login to review");
    if (!comment.trim()) return toast.error("Please write a comment");

    setIsSubmittingReview(true);
    try {
      const reviewedUserId = toPositiveIntegerId(userId);
      if (!reviewedUserId) {
        toast.error("Invalid seller ID");
        return;
      }

      const response = await api.reviews.addReview({
        reviewedUserId,
        rating,
        comment: comment.trim(),
      });

      if (response.success) {
        toast.success("Review submitted!");
        setComment("");
        loadData(); // Refresh reviews
      } else {
        toast.error(response.message || "Failed to submit review");
      }
    } catch (e) {
      toast.error("Error submitting review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">
        Loading Seller Profile...
      </div>
    );
  }

  const parsedJoinDate = sellerProfile?.joinDate
    ? new Date(sellerProfile.joinDate)
    : null;
  const joinYear =
    parsedJoinDate && !Number.isNaN(parsedJoinDate.getTime())
      ? parsedJoinDate.getFullYear()
      : "2024";

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        style={{ color: "#0A4ABF" }}
        className="mb-4 hover:bg-blue-50 transition-all duration-200 hover:scale-105 -ml-2 rounded-xl h-10 px-3"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        <span className="font-semibold">Back</span>
      </Button>
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
        {/* Banner */}
        <div
          className="h-32 sm:h-48 w-full relative"
          style={{
            background: "linear-gradient(135deg, #0A4ABF 0%, #3E7EFF 100%)",
          }}
        >
          <div className="absolute inset-0 bg-black/10" />
        </div>

        <div className="px-6 pb-6 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-8 sm:-mt-10">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800 shadow-md flex items-center justify-center overflow-hidden">
                {sellerProfile?.avatar ? (
                  <img
                    src={sellerProfile.avatar}
                    className="w-full h-full object-cover"
                    alt={sellerProfile.name}
                  />
                ) : (
                  <User className="w-10 h-10 sm:w-14 sm:h-14 text-gray-400" />
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left mb-2">
              <div className="mb-2">
                <span className="inline-flex items-center rounded-full bg-blue-50 text-[#0A4ABF] px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  Seller Profile
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                {sellerProfile?.name || `User ${userId}`}
              </h1>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 px-3 py-1 rounded-full">
                  <MapPin className="w-4 h-4 text-[#0A4ABF]" />
                  <span>{sellerProfile?.location || "Jordan"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 px-3 py-1 rounded-full">
                  <Calendar className="w-4 h-4 text-[#0A4ABF]" />
                  <span>
                    Joined {joinYear}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/10 px-3 py-1 rounded-full text-yellow-700 dark:text-yellow-500 font-medium border border-yellow-100 dark:border-yellow-900/20">
                  <Star className="w-4 h-4 fill-current" />
                  <span>
                    {reviews.length > 0
                      ? (
                          reviews.reduce((acc, r) => acc + r.rating, 0) /
                          reviews.length
                        ).toFixed(1)
                      : "New"}{" "}
                    ({reviews.length} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-2">
              <Button
                onClick={() => navigate(`/chat/${userId}`)}
                className="shadow-sm hover:shadow-md transition-all rounded-xl"
                style={{ backgroundColor: "#0A4ABF" }}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat with Seller
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Active Listings */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Active Listings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeListings.length > 0 ? (
              activeListings.map((post: Product) => (
                <ProductCard
                  key={post.id}
                  product={post}
                  onProductClick={(productId) => navigate(`/product/${productId}`)}
                  isAuthenticated={isAuthenticated}
                  currentUserId={isAuthenticated ? user?.id : undefined}
                  currentUserDisplayName={user?.name}
                />
              ))
            ) : (
              <p className="text-gray-500">No active listings.</p>
            )}
          </div>
        </div>

        {/* Right Column: Reviews */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Reviews
          </h2>

          {/* Add Review Form */}
          {isAuthenticated && user?.id !== userId && (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-medium mb-2">Write a Review</h3>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    type="button"
                  >
                    <Star
                      className={`w-5 h-5 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mb-2 bg-white dark:bg-gray-800"
              />
              <Button
                size="sm"
                onClick={submitReview}
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? "Submitting..." : "Post Review"}
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review, idx) => (
                <div
                  key={review.reviewID || idx}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="font-medium text-sm">
                        {review.reviewerName || "User " + review.reviewerID}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex text-yellow-500 mb-2">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {review.comment}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No reviews yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
