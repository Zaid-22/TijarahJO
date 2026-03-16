import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  User,
  MapPin,
  Calendar,
  Star,
  MessageSquare,
} from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { api } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { toast } from "sonner";
import { PostCard } from "../../marketplace/components/PostCard";
import { Textarea } from "../../../shared/ui/textarea";
import { toPositiveIntegerId } from "../../../utils/idValidation";
import { useSellerProfileData } from "../hooks/useSellerProfileData";
import { Post } from "../../../types";
import { resolveDocumentLanguage } from "../../../shared/lib/locale";
import { SubpageHeader } from "../../../shared/ui/subpage-header";
import { PageShell } from "../../../shared/ui/page-shell";
import {
  buildCurrentPath,
  resolveBackPathFromLocationState,
} from "../../../shared/lib/backNavigation";
import { LoadingState } from "../../../shared/ui/loading-state";

export function SellerProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { activeListings, reviews, isLoading, sellerProfile, reload } =
    useSellerProfileData(userId);
  const language = resolveDocumentLanguage();
  const isRTL = language === "ar";
  const dateLocale = language === "ar" ? "ar-JO" : "en-US";
  const currentPath = buildCurrentPath(location.pathname, location.search);
  const safeBackPath = resolveBackPathFromLocationState({
    locationState: location.state,
    currentPath,
    fallbackPath: "/",
  });
  const labels = {
    loginToReview:
      language === "ar"
        ? "يرجى تسجيل الدخول لإضافة تقييم"
        : "Please login to review",
    writeComment:
      language === "ar" ? "يرجى كتابة تعليق" : "Please write a comment",
    invalidSeller:
      language === "ar" ? "معرّف البائع غير صالح" : "Invalid seller ID",
    reviewSubmitted:
      language === "ar" ? "تم إرسال التقييم بنجاح!" : "Review submitted!",
    reviewFailed:
      language === "ar" ? "فشل إرسال التقييم" : "Failed to submit review",
    reviewError:
      language === "ar" ? "حدث خطأ أثناء إرسال التقييم" : "Error submitting review",
    loading:
      language === "ar" ? "جارٍ تحميل ملف البائع..." : "Loading Seller Profile...",
    back: language === "ar" ? "العودة" : "Back",
    sellerProfile:
      language === "ar" ? "ملف البائع" : "Seller Profile",
    joined: language === "ar" ? "انضم" : "Joined",
    jordan: language === "ar" ? "الأردن" : "Jordan",
    reviews: language === "ar" ? "التقييمات" : "Reviews",
    reviewCountWord: language === "ar" ? "تقييم" : "reviews",
    newSeller: language === "ar" ? "جديد" : "New",
    chatWithSeller:
      language === "ar" ? "الدردشة مع البائع" : "Chat with Seller",
    activeListings:
      language === "ar" ? "الإعلانات النشطة" : "Active Listings",
    noActiveListings:
      language === "ar" ? "لا توجد إعلانات نشطة." : "No active listings.",
    writeReview:
      language === "ar" ? "اكتب تقييماً" : "Write a Review",
    reviewPlaceholder:
      language === "ar" ? "شارك تجربتك..." : "Share your experience...",
    submitting:
      language === "ar" ? "جارٍ الإرسال..." : "Submitting...",
    postReview:
      language === "ar" ? "نشر التقييم" : "Post Review",
    noReviews:
      language === "ar" ? "لا توجد تقييمات بعد." : "No reviews yet.",
    userLabel: language === "ar" ? "مستخدم" : "User",
    rateStar: (star: number) =>
      language === "ar"
        ? `قيّم ${star} نجمة${star > 1 ? "ات" : ""}`
        : `Rate ${star} star${star > 1 ? "s" : ""}`,
  };

  // Review Form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const submitReview = async () => {
    if (!isAuthenticated) return toast.error(labels.loginToReview);
    if (!comment.trim()) return toast.error(labels.writeComment);

    setIsSubmittingReview(true);
    try {
      const reviewedUserId = toPositiveIntegerId(userId);
      if (!reviewedUserId) {
        toast.error(labels.invalidSeller);
        return;
      }

      const response = await api.reviews.addReview({
        reviewedUserId,
        rating,
        comment: comment.trim(),
      });

      if (response.success) {
        toast.success(labels.reviewSubmitted);
        setComment("");
        reload();
      } else {
        toast.error(response.message || labels.reviewFailed);
      }
    } catch {
      toast.error(labels.reviewError);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <PageShell>
        <SubpageHeader
          onBack={() => navigate(safeBackPath)}
          isRTL={isRTL}
          backLabel={labels.back}
          title={labels.sellerProfile}
          showLogo={false}
        />
        <LoadingState label={labels.loading} minHeightClassName="min-h-96" />
      </PageShell>
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
    <PageShell>
      <SubpageHeader
        onBack={() => navigate(safeBackPath)}
        isRTL={isRTL}
        backLabel={labels.back}
        title={labels.sellerProfile}
        showLogo={false}
      />
      <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Profile Header */}
      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden mb-8">
        {/* Banner */}
        <div className="h-32 sm:h-48 w-full relative bg-gradient-to-br from-primary to-secondary">
          <div className="absolute inset-0 bg-black/10" />
        </div>

        <div className="px-6 pb-6 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-8 sm:-mt-10">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background bg-card shadow-md flex items-center justify-center overflow-hidden">
                {sellerProfile?.avatar ? (
                  <img
                    src={sellerProfile.avatar}
                    className="w-full h-full object-cover"
                    alt={sellerProfile.name}
                  />
                ) : (
                  <User className="w-10 h-10 sm:w-14 sm:h-14 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left mb-2">
              <div className="mb-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  {labels.sellerProfile}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 leading-tight">
                {sellerProfile?.name || `${labels.userLabel} ${userId}`}
              </h1>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 bg-muted px-3 py-1 rounded-full border border-border">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{sellerProfile?.location || labels.jordan}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted px-3 py-1 rounded-full border border-border">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>
                    {labels.joined} {joinYear}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-full text-amber-700 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-900/60">
                  <Star className="w-4 h-4 fill-current" />
                  <span>
                    {reviews.length > 0
                      ? (
                          reviews.reduce((acc, r) => acc + r.rating, 0) /
                          reviews.length
                        ).toFixed(1)
                      : labels.newSeller}{" "}
                    ({reviews.length} {labels.reviewCountWord})
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-2">
              <Button
                onClick={() =>
                  navigate(`/chat/${userId}`, {
                    state: {
                      fromPath: currentPath,
                    },
                  })
                }
                className="shadow-sm hover:shadow-md transition-all rounded-xl bg-primary hover:bg-primary/90"
              >
                <MessageSquare className={`w-4 h-4 me-2`} />
                {labels.chatWithSeller}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Active Listings */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-foreground">
            {labels.activeListings}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeListings.length > 0 ? (
              activeListings.map((post: Post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostClick={(postId) =>
                    navigate(`/post/${postId}`, {
                      state: {
                        fromPath: `${location.pathname}${location.search}`,
                      },
                    })
                  }
                  isAuthenticated={isAuthenticated}
                  currentUserId={isAuthenticated ? user?.id : undefined}
                  currentUserDisplayName={user?.name}
                  language={language}
                />
              ))
            ) : (
              <p className="text-muted-foreground">{labels.noActiveListings}</p>
            )}
          </div>
        </div>

        {/* Right Column: Reviews */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground">
            {labels.reviews}
          </h2>

          {/* Add Review Form */}
          {isAuthenticated && user?.id !== userId && (
            <div className="bg-card/90 p-4 rounded-lg border border-border">
              <h3 className="font-medium mb-2">{labels.writeReview}</h3>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    aria-label={labels.rateStar(star)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Star
                      className={`w-5 h-5 ${star <= rating ? "text-amber-500 fill-current" : "text-muted-foreground/70"}`}
                    />
                  </Button>
                ))}
              </div>
              <Textarea
                placeholder={labels.reviewPlaceholder}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mb-2 bg-background"
              />
              <Button
                size="sm"
                onClick={submitReview}
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? labels.submitting : labels.postReview}
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review, idx) => (
                <div
                  key={review.reviewID || idx}
                  className="bg-card p-4 rounded-lg shadow-sm border border-border"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-sm">
                        {review.reviewerName || `${labels.userLabel} ${review.reviewerID}`}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.timestamp).toLocaleDateString(dateLocale)}
                    </span>
                  </div>
                  <div className="flex text-amber-500 mb-2">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">{labels.noReviews}</p>
            )}
          </div>
        </div>
      </div>
      </div>
    </PageShell>
  );
}
