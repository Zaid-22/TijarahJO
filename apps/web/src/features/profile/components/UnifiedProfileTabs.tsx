import type { ReactNode } from "react";
import { Star, ShoppingBag, BadgeCheck } from "lucide-react";
import { getViewModeGridClass } from "../../../shared/lib/viewModeGrid";
import { Button } from "../../../shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../shared/ui/tabs";
import { Textarea } from "../../../shared/ui/textarea";
import type { Post, ViewMode } from "../../../types";
import type { UnifiedProfileViewModel, UnifiedProfileReview } from "../types";
import { UnifiedProfileReviewCard } from "./UnifiedProfileReviewCard";
import type { UnifiedProfileLabels } from "./unifiedProfileLabels";

interface UnifiedProfileTabsProps {
  labels: UnifiedProfileLabels;
  viewModel: UnifiedProfileViewModel;
  listingViewMode: ViewMode;
  averageRating: string;
  rating: number;
  comment: string;
  isSubmittingReview: boolean;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onReviewSubmit: () => void;
  onAddPostClick?: () => void;
  renderListingCard: (post: Post) => ReactNode;
  dateLocale: string;
  onReportReview?: (review: UnifiedProfileReview) => void;
  currentUserId?: string;
}

export function UnifiedProfileTabs({
  labels,
  viewModel,
  listingViewMode,
  rating,
  comment,
  isSubmittingReview,
  onRatingChange,
  onCommentChange,
  onReviewSubmit,
  renderListingCard,
  dateLocale,
  onReportReview,
  currentUserId,
}: UnifiedProfileTabsProps) {
  return (
    <div className="mt-2">
      <Tabs defaultValue="active" className="w-full gap-5">
        <div className="mb-4 flex flex-col gap-3 px-2 sm:px-4 md:flex-row md:items-center md:justify-between">
          <TabsList className="h-auto w-full min-w-0 flex-nowrap justify-start gap-6 overflow-x-auto whitespace-nowrap bg-transparent p-0 border-b border-border/60 sm:flex-wrap md:w-fit hide-scrollbar">
            <TabsTrigger
              value="active"
              className="flex-none relative h-auto rounded-none border-0 border-b-2 border-transparent px-2 py-3.5 text-sm font-semibold text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-transparent data-[state=active]:border-b-primary data-[state=active]:shadow-none transition-all hover:text-foreground"
            >
              <span>{labels.activeListings}</span>
              <span className="opacity-80 ms-1.5">({viewModel.activeListings.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="sold"
              className="flex-none relative h-auto rounded-none border-0 border-b-2 border-transparent px-2 py-3.5 text-sm font-semibold text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-transparent data-[state=active]:border-b-primary data-[state=active]:shadow-none transition-all hover:text-foreground"
            >
              <span>{labels.soldListings}</span>
              <span className="opacity-80 ms-1.5">({viewModel.soldListings.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="flex-none relative h-auto rounded-none border-0 border-b-2 border-transparent px-2 py-3.5 text-sm font-semibold text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-transparent data-[state=active]:border-b-primary data-[state=active]:shadow-none transition-all hover:text-foreground"
            >
              <span>{labels.reviews}</span>
              <span className="opacity-80 ms-1.5">({viewModel.reviews.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="active" className="mt-4">
          {viewModel.activeListings.length > 0 ? (
            <div className={`grid gap-4 ${getViewModeGridClass(listingViewMode)}`}>
              {viewModel.activeListings.map((post) => renderListingCard(post))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-1 text-lg font-bold text-foreground">
                {labels.noActiveListings}
              </h3>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sold" className="mt-4">
          {viewModel.soldListings.length > 0 ? (
            <div className={`grid gap-4 ${getViewModeGridClass(listingViewMode)}`}>
              {viewModel.soldListings.map((post) => renderListingCard(post))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <BadgeCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-1 text-lg font-bold text-foreground">
                {labels.noSoldListings}
              </h3>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-1">
          <div className="mb-6 border-b border-border pb-4">
            <h2 className="text-xl font-bold text-foreground">{labels.reviews}</h2>
          </div>

          {viewModel.canReview ? (
            <div className="mb-8 rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm transition-shadow focus-within:border-primary/40 focus-within:shadow-md">
              <h3 className="mb-1 text-lg font-bold text-foreground">
                {labels.writeReview}
              </h3>
              <p className="mb-5 text-sm text-muted-foreground">
                {labels.reviewPrompt}
              </p>

              <div className="mb-5 flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => onRatingChange(star)}
                    aria-label={labels.rateStar(star)}
                    className="group flex h-10 w-10 items-center justify-center rounded-full outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-amber-500/50 active:scale-95"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        star <= rating
                          ? "fill-amber-500 text-amber-500"
                          : "text-muted-foreground/20 group-hover:text-amber-500/40"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <Textarea
                placeholder={labels.reviewPlaceholder}
                value={comment}
                onChange={(event) => onCommentChange(event.target.value)}
                className="mb-5 min-h-32 resize-none rounded-xl bg-muted/40 border-border/50 focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />

              <div className="flex justify-end">
                <Button
                  onClick={onReviewSubmit}
                  disabled={isSubmittingReview || rating === 0}
                  className="w-full rounded-xl px-8 font-bold sm:w-auto shadow-sm"
                >
                  {isSubmittingReview ? labels.submitting : labels.postReview}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            {viewModel.reviews.length > 0 ? (
              viewModel.reviews.map((review) => (
                <UnifiedProfileReviewCard
                  key={review.reviewID}
                  review={review}
                  labels={labels}
                  dateLocale={dateLocale}
                  onReportReview={onReportReview}
                  currentUserId={currentUserId}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
                  <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
                </div>
                <h3 className="mb-1 text-lg font-bold text-foreground">
                  {labels.noReviews}
                </h3>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
