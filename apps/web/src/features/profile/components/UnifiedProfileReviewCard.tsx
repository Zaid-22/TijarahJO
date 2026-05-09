import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, User } from "lucide-react";
import type { UnifiedProfileReview } from "../types";
import type { UnifiedProfileLabels } from "./unifiedProfileLabels";
import { formatCompactDateTime } from "../../../shared/lib/dateTime";
import { resolveAvatarSrc, getAvatarInitial } from "../../../shared/lib/avatar";

interface UnifiedProfileReviewCardProps {
  review: UnifiedProfileReview;
  labels: UnifiedProfileLabels;
  dateLocale: string;
}

export function UnifiedProfileReviewCard({
  review,
  labels,
  dateLocale,
}: UnifiedProfileReviewCardProps) {
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const formattedTimestamp = formatCompactDateTime(review.timestamp, dateLocale);
  const reviewerAvatarSrc = resolveAvatarSrc(review.reviewerAvatar);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [review.reviewerAvatar]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <Link
              to={`/seller/${review.reviewerID}`}
              className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-muted border border-border/50 hover:ring-2 hover:ring-primary/50 transition-all shadow-sm"
            >
              {reviewerAvatarSrc && !avatarLoadFailed ? (
                <img
                  src={reviewerAvatarSrc}
                  alt={review.reviewerName || `${labels.userLabel} ${review.reviewerID}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : review.reviewerName ? (
                <span className="text-base font-bold text-foreground/70">
                  {getAvatarInitial(review.reviewerName)}
                </span>
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
            </Link>
            <div className="flex flex-col">
              <Link
                to={`/seller/${review.reviewerID}`}
                className="text-sm font-bold text-foreground hover:text-primary transition-colors"
              >
                {review.reviewerName || `${labels.userLabel} ${review.reviewerID}`}
              </Link>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      className={`h-3.5 w-3.5 ${
                        index < review.rating
                          ? "fill-amber-500 text-amber-500"
                          : "text-muted-foreground/20"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-foreground/80">
                  {review.rating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {formattedTimestamp}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {review.comment}
        </p>
      </div>
    </div>
  );
}
