import React from "react";
import { CardContent } from "../../../shared/ui/card";
import { Badge } from "../../../shared/ui/badge";
import { Star } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { PostCardFavoriteButton } from "./PostCardFavoriteButton";
import { PostCardPriceBadge } from "./PostCardPriceBadge";
import { postCardMediaClass } from "./postCardMediaClass";
import { usePostCardState, type PostCardSharedProps } from "./usePostCardState";

export const PostCardGrid = React.memo(function PostCardGrid(props: PostCardSharedProps) {
  const { post, isFavorite = false } = props;
  const {
    labels,
    priceLocale,
    showFavoriteButton,
    handleFavoriteClick,
    openPost,
  } = usePostCardState(props);
  const sellerAverageRating =
    typeof post.averageRating === "number" && post.averageRating > 0
      ? post.averageRating
      : null;
  const sellerReviewCount =
    typeof post.reviewCount === "number" && post.reviewCount > 0
      ? post.reviewCount
      : null;
  const hasSellerRating =
    sellerAverageRating !== null && sellerReviewCount !== null;
  const detailLocation = post.area
    ? post.location + ", " + post.area
    : post.location;

  return (
    <article className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[24px] border border-border/60 bg-card animate-fade-in shadow-sm sm:shadow-md">
      <button
        type="button"
        onClick={openPost}
        aria-label={labels.viewDetailsAria}
        className="absolute inset-0 z-10 rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      />

      <div className="px-3 pt-3">
        <div
          className={`${postCardMediaClass} pointer-events-none rounded-[20px] border border-border/40 bg-muted/30 aspect-[16/9] overflow-hidden shadow-[0_10px_24px_rgba(15,23,42,0.10)]`}
        >
          <ImageWithFallback
            src={post.image}
            alt={post.name}
            className="absolute inset-0 block h-full min-h-full w-full min-w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] via-transparent to-black/[0.18]" />

          {post.status === "SOLD" && (
            <div className="absolute left-3 top-3 z-10">
              <Badge className="border-white/35 bg-slate-950/55 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/40">
                {labels.soldOut}
              </Badge>
            </div>
          )}

          {post.condition && post.status !== "SOLD" && (
            <div className="absolute bottom-3 left-3 z-10">
              <Badge className="border-white/35 bg-white/78 px-2 py-0.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
                {post.condition}
              </Badge>
            </div>
          )}

          <div className="absolute bottom-2.5 right-2.5 z-10">
            <PostCardPriceBadge
              price={post.price}
              currency={labels.currency}
              locale={priceLocale}
            />
          </div>
        </div>
      </div>

      {showFavoriteButton && (
        <PostCardFavoriteButton
          isFavorite={isFavorite}
          label={labels.favoriteLabel}
          onClick={handleFavoriteClick}
          className="absolute right-5 top-5 z-30 pointer-events-auto h-9 w-9"
        />
      )}

      <CardContent className="pointer-events-none relative z-20 flex flex-grow flex-col px-4 pb-4 pt-3.5 sm:px-4.5 sm:pb-4.5 sm:pt-3.5">
        <div className="flex-grow space-y-1">
          <h3 className="line-clamp-1 text-[1.02rem] font-semibold leading-[1.2] tracking-[-0.015em] text-foreground transition-colors group-hover:text-primary sm:text-[1.12rem]">
            {post.name}
          </h3>
          {detailLocation ? (
            <p className="line-clamp-1 text-sm font-medium text-slate-600 dark:text-slate-300">
              {detailLocation}
            </p>
          ) : (
            <div className="h-5" />
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5">
            {hasSellerRating && (
              <div className="flex flex-shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Star className="h-3 w-3 fill-current" />
                <span>
                  {sellerAverageRating?.toFixed(1)}
                  <span className="ms-1 font-medium opacity-70">
                    ({sellerReviewCount})
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </article>
  );
});
