import type { ReactNode } from "react";
import { Plus, Star } from "lucide-react";
import { getViewModeGridClass } from "../../../shared/lib/viewModeGrid";
import { Button } from "../../../shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../shared/ui/tabs";
import { Textarea } from "../../../shared/ui/textarea";
import type { Post, ViewMode } from "../../../types";
import type { UnifiedProfileViewModel } from "../types";
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
}

export function UnifiedProfileTabs({
  labels,
  viewModel,
  listingViewMode,
  averageRating,
  rating,
  comment,
  isSubmittingReview,
  onRatingChange,
  onCommentChange,
  onReviewSubmit,
  onAddPostClick,
  renderListingCard,
  dateLocale,
}: UnifiedProfileTabsProps) {
  return (
    <div className="mt-2">
      <Tabs defaultValue="active" className="w-full gap-5">
        <div className="mb-4 flex flex-col gap-3 px-2 sm:px-4 md:flex-row md:items-center md:justify-between">
          <TabsList className="h-auto w-full min-w-0 flex-nowrap justify-start gap-2 overflow-x-auto whitespace-nowrap bg-transparent p-1 sm:flex-wrap sm:gap-3 md:w-fit hide-scrollbar">
            <TabsTrigger
              value="active"
              className="flex-none h-auto rounded-[14px] border border-transparent px-4 py-2.5 text-[0.95rem] font-semibold text-muted-foreground shadow-none data-[state=active]:bg-card dark:data-[state=active]:bg-muted/50 data-[state=active]:text-primary data-[state=active]:border-border/60 data-[state=active]:shadow-sm transition-all"
            >
              <span>{labels.activeListings}</span>
              <span className="opacity-80 ms-1.5">({viewModel.activeListings.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="sold"
              className="flex-none h-auto rounded-[14px] border border-transparent px-4 py-2.5 text-[0.95rem] font-semibold text-muted-foreground shadow-none data-[state=active]:bg-card dark:data-[state=active]:bg-muted/50 data-[state=active]:text-primary data-[state=active]:border-border/60 data-[state=active]:shadow-sm transition-all"
            >
              <span>{labels.soldListings}</span>
              <span className="opacity-80 ms-1.5">({viewModel.soldListings.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="flex-none h-auto rounded-[14px] border border-transparent px-4 py-2.5 text-[0.95rem] font-semibold text-muted-foreground shadow-none data-[state=active]:bg-card dark:data-[state=active]:bg-muted/50 data-[state=active]:text-primary data-[state=active]:border-border/60 data-[state=active]:shadow-sm transition-all"
            >
              <span>{labels.reviews}</span>
              <span className="opacity-80 ms-1.5">({viewModel.reviews.length})</span>
            </TabsTrigger>
          </TabsList>

          {viewModel.canManageListings && onAddPostClick ? (
            <Button
              variant="outline"
              className="h-10 w-full rounded-xl border border-primary/15 bg-primary/5 px-4 text-sm font-semibold text-primary shadow-none hover:bg-primary/10 hover:text-primary sm:w-auto"
              onClick={onAddPostClick}
            >
              <Plus className="me-2 h-4 w-4 text-primary/90" />
              {labels.addPost}
            </Button>
          ) : null}
        </div>

        <TabsContent value="active" className="mt-1">
          {viewModel.activeListings.length > 0 ? (
            <div className={`grid gap-4 ${getViewModeGridClass(listingViewMode)}`}>
              {viewModel.activeListings.map((post) => renderListingCard(post))}
            </div>
          ) : (
            <p className="py-6 text-muted-foreground">{labels.noActiveListings}</p>
          )}
        </TabsContent>

        <TabsContent value="sold" className="mt-1">
          {viewModel.soldListings.length > 0 ? (
            <div className={`grid gap-4 ${getViewModeGridClass(listingViewMode)}`}>
              {viewModel.soldListings.map((post) => renderListingCard(post))}
            </div>
          ) : (
            <p className="py-6 text-muted-foreground">{labels.noSoldListings}</p>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-1">
          <div className="mb-5 flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">{labels.reviews}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {labels.reviewsDescription}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15">
                <Star className="h-5 w-5 fill-current text-amber-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">
                  {averageRating}
                </p>
                <p className="text-xs text-muted-foreground">
                  {viewModel.reviews.length} {labels.reviewCountWord}
                </p>
              </div>
            </div>
          </div>

          {viewModel.canReview ? (
            <div className="mb-5 rounded-2xl border border-border bg-muted/30 p-4">
              <h3 className="mb-1 text-lg font-semibold text-foreground">
                {labels.writeReview}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {labels.reviewPrompt}
              </p>
              <div className="mb-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    type="button"
                    onClick={() => onRatingChange(star)}
                    aria-label={labels.rateStar(star)}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        star <= rating
                          ? "fill-current text-amber-500"
                          : "text-muted-foreground/70"
                      }`}
                    />
                  </Button>
                ))}
              </div>
              <Textarea
                placeholder={labels.reviewPlaceholder}
                value={comment}
                onChange={(event) => onCommentChange(event.target.value)}
                className="mb-3 bg-background"
              />
              <Button
                onClick={onReviewSubmit}
                disabled={isSubmittingReview}
                className="w-full sm:w-auto"
              >
                {isSubmittingReview ? labels.submitting : labels.postReview}
              </Button>
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
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
                <Star className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">{labels.noReviews}</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
