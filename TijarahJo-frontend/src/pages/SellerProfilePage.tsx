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
import { Button } from "../components/ui/button";
// import { api } from "../services/api"; // Ensure api supports reviews or fetch directly
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
// import { ProductCard } from "../components/figma/ProductCard";
import { Textarea } from "../components/ui/textarea";

export function SellerProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const apiBaseUrl =
    (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5033/api";

  // const [seller, setSeller] = useState<any>(null);
  const [activeListings, setActiveListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sellerProfile, setSellerProfile] = useState<{
    name: string;
    joinDate: any;
    location: string;
    avatar: any;
  } | null>(null);

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
      // 0. Fetch User Details explicitly
      const userRes = await fetch(`${apiBaseUrl}/users/${userId}`);
      if (userRes.ok) {
        const userPayload = await userRes.json();
        const user = userPayload?.data || userPayload;
        // setSeller(user); // If we had a seller state object

        // Extended logic to use fetched user data (hacky state updates matching existing structure)
        const firstName = user?.FirstName || user?.firstName || "";
        const lastName = user?.LastName || user?.lastName || "";
        const fullName = user?.Name || `${firstName} ${lastName}`.trim();
        const city = user?.City || user?.city;
        const area = user?.Area || user?.area;
        const location =
          [area, city].filter(Boolean).join(", ") || "Amman, Jordan";
        // Update title directly or via state if we had one.
        // Since the original code didn't have a user state, we should probably add one or update the UI to use variables if we re-render.
        // Let's add a state for sellerProfile
        setSellerProfile({
          name: fullName || `User ${userId}`,
          joinDate:
            user?.JoinedDate ||
            user?.joinedDate ||
            user?.JoinDate ||
            user?.joinDate ||
            "2024",
          location,
          avatar: user?.Avatar || user?.avatar,
        });
      }

      // 1. Fetch Posts (Active Listings)
      const postsRes = await fetch(`${apiBaseUrl}/posts/user/${userId}`);
      if (postsRes.ok) {
        const postsPayload = await postsRes.json();
        const posts = Array.isArray(postsPayload)
          ? postsPayload
          : postsPayload?.data || [];
        const activePosts = posts.filter((post: any) => {
          const status = post?.Status ?? post?.status;
          const isDeleted = Boolean(post?.IsDeleted ?? post?.isDeleted ?? false);
          if (isDeleted) {
            return false;
          }

          return (
            status === 0 ||
            status === "0" ||
            String(status || "").toUpperCase() === "ACTIVE"
          );
        });
        setActiveListings(activePosts);
      }

      // Fetch Reviews
      const reviewRes = await fetch(`${apiBaseUrl}/reviews/user/${userId}`);
      if (reviewRes.ok) {
        const reviewPayload = await reviewRes.json();
        const reviewList = Array.isArray(reviewPayload)
          ? reviewPayload
          : reviewPayload?.data || [];
        const normalizedReviews = reviewList.map((review: any) => {
          const reviewId = review?.ReviewID ?? review?.reviewID;
          const reviewerId = review?.ReviewerID ?? review?.reviewerID ?? 0;
          const rawRating = Number(review?.Rating ?? review?.rating ?? 0);
          const safeRating =
            Number.isFinite(rawRating) && rawRating > 0
              ? Math.min(5, Math.max(1, Math.round(rawRating)))
              : 0;
          const rawTimestamp = review?.Timestamp ?? review?.timestamp;
          const parsedTimestamp = rawTimestamp ? new Date(rawTimestamp) : null;
          const timestamp =
            parsedTimestamp && !Number.isNaN(parsedTimestamp.getTime())
              ? parsedTimestamp.toISOString()
              : new Date().toISOString();

          return {
            reviewID: reviewId,
            reviewerID: reviewerId,
            reviewerName:
              review?.ReviewerName || review?.reviewerName || `User ${reviewerId}`,
            rating: safeRating,
            comment: review?.Comment || review?.comment || "",
            timestamp,
          };
        });
        setReviews(normalizedReviews);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const submitReview = async () => {
    if (!isAuthenticated) return toast.error("Please login to review");
    if (!comment.trim()) return toast.error("Please write a comment");

    setIsSubmittingReview(true);
    try {
      const token = localStorage.getItem("tijarahjo_token");
      const res = await fetch(`${apiBaseUrl}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reviewedUserId: parseInt(userId || "0"),
          reviewerID: 0, // Backend sets this
          rating,
          comment,
          timestamp: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        toast.success("Review submitted!");
        setComment("");
        loadData(); // Refresh reviews
      } else {
        const txt = await res.text();
        toast.error(txt || "Failed to submit review");
      }
    } catch (e) {
      toast.error("Error submitting review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading)
    return <div className="p-10 text-center">Loading Seller Profile...</div>;

  const parsedJoinDate = sellerProfile?.joinDate
    ? new Date(sellerProfile.joinDate)
    : null;
  const joinYear =
    parsedJoinDate && !Number.isNaN(parsedJoinDate.getTime())
      ? parsedJoinDate.getFullYear()
      : "2024";

  return (
    <div className="container mx-auto p-4 max-w-6xl mt-20">
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
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12 sm:-mt-16">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
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
              activeListings.map((post: any) => (
                // Very simplified mapping, ideally transformPostModelToProduct shared logic
                <div
                  key={post.postID || post.PostID}
                  className="border p-4 rounded bg-white dark:bg-gray-800"
                >
                  <h3 className="font-bold">
                    {post.postTitle || post.PostTitle}
                  </h3>
                  <p className="text-green-600 font-bold">
                    {post.price || post.Price} JOD
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() =>
                      navigate(`/product/${post.postID || post.PostID}`)
                    }
                  >
                    View
                  </Button>
                </div>
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
