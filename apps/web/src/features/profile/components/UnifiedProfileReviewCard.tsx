import { Star, User } from "lucide-react";
import type { UnifiedProfileReview } from "../types";
import type { UnifiedProfileLabels } from "./unifiedProfileLabels";

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
  return (
    <div className="rounded-2xl border border-border bg-background/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {review.reviewerName || `${labels.userLabel} ${review.reviewerID}`}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex text-amber-500">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className={`h-3.5 w-3.5 ${
                      index < review.rating
                        ? "fill-current text-amber-500"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {review.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(review.timestamp).toLocaleDateString(dateLocale)}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {review.comment}
      </p>
    </div>
  );
}
