import { useEffect, useState } from "react";
import { Star, User } from "lucide-react";
import { api } from "../../../services/api";
import { RawReview } from "../../../services/api/reviews";
import { LoadingState } from "../../../shared/ui/loading-state";

interface ProfileReviewsSectionProps {
  userId: string;
  language: "en" | "ar";
  t: Record<string, string>;
}

export function ProfileReviewsSection({
  userId,
  language,
  t,
}: ProfileReviewsSectionProps) {
  const [reviews, setReviews] = useState<RawReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isRTL = language === "ar";
  const dateLocale = isRTL ? "ar-JO" : "en-US";

  const labels = {
    reviews: t.reviews || (isRTL ? "التقييمات" : "Reviews"),
    noReviews: t.noReviews || (isRTL ? "لا توجد تقييمات بعد." : "No reviews yet."),
    userLabel: t.userLabel || (isRTL ? "مستخدم" : "User"),
    loading: t.loading || (isRTL ? "جارٍ التحميل..." : "Loading..."),
  };

  useEffect(() => {
    let mounted = true;

    async function fetchReviews() {
      if (!userId) return;
      try {
        setIsLoading(true);
        const data = await api.reviews.getUserReviews(userId);
        if (mounted && data) {
          setReviews(data);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch reviews:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchReviews();

    return () => {
      mounted = false;
    };
  }, [userId]);

  if (isLoading) {
    return (
      <div className="bg-card p-6 rounded-3xl shadow-sm border border-border">
        <h2 className="text-xl font-bold text-foreground mb-6">
          {labels.reviews}
        </h2>
        <LoadingState label={labels.loading} minHeightClassName="min-h-32" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl shadow-sm border border-border mt-6">
      <div className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-6">
          {labels.reviews}
        </h2>

      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review, idx) => {
            // Need to handle both property cases depending on API response parsing
            const reviewId = String(review.ReviewID || review.reviewID || idx);
            // The API response might have the reviewer name in a nested object or capitalized differently
            const reviewerName = String(review.ReviewerName || review.reviewerName || review.reviewer?.name || review.Reviewer?.Name || "");
            const reviewerId = String(review.ReviewerID || review.reviewerID || "");
            const rating = Number(review.Rating || review.rating || 0);
            
            // Handle timestamp parsing safely
            const rawTimestamp = review.Timestamp || review.timestamp;
            let timestamp = new Date();
            if (typeof rawTimestamp === 'string' || typeof rawTimestamp === 'number') {
                timestamp = new Date(rawTimestamp);
            } else if (rawTimestamp instanceof Date) {
               timestamp = rawTimestamp;
            }

            const comment = String(review.Comment || review.comment || "");

            return (
              <div
                key={reviewId}
                className="bg-background p-4 rounded-xl border border-border"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-sm">
                      {reviewerName && reviewerName.trim() !== "" ? reviewerName : `${labels.userLabel} ${reviewerId}`}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {timestamp.toLocaleDateString(dateLocale)}
                  </span>
                </div>
                <div className="flex text-amber-500 mb-2">
                  {[...Array(rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{comment}</p>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{labels.noReviews}</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
