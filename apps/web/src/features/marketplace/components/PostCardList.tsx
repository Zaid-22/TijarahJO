import React from "react";
import { Badge } from "../../../shared/ui/badge";
import { Clock3, Eye, MapPin, Sparkles, Star } from "lucide-react";
import { formatPostedAgo } from "../../post-details/postDetailsUtils";
import { ImageWithFallback } from "./ImageWithFallback";
import { PostCardFavoriteButton } from "./PostCardFavoriteButton";
import { PostCardPriceBadge } from "./PostCardPriceBadge";
import { postCardMediaClass } from "./postCardMediaClass";
import { usePostCardState, type PostCardSharedProps } from "./usePostCardState";

export const PostCardList = React.memo(function PostCardList(props: PostCardSharedProps) {
  const { post, isFavorite = false } = props;
  const {
    labels,
    resolvedLanguage,
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
  const postedAgo = formatPostedAgo(
    post.createdAt,
    Date.now(),
    resolvedLanguage,
    "",
  );
  const detailLocation = post.area ? `${post.location}, ${post.area}` : post.location;
  const hasDescription = Boolean(post.description?.trim());

  return (
    <article className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[24px] border border-border/60 bg-card transition-all duration-300 shadow-[0_14px_34px_rgba(15,23,42,0.08)] hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(15,23,42,0.14)] sm:flex-row">
      <button
        type="button"
        onClick={openPost}
        aria-label={labels.viewDetailsAria}
        className="absolute inset-0 z-10 rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      />

      <div className="px-3 pt-3 sm:w-[19.5rem] sm:flex-shrink-0 sm:pb-3">
        <div
          className={`${postCardMediaClass} pointer-events-none rounded-[20px] border border-border/40 bg-muted/30 aspect-[16/9] overflow-hidden sm:h-full sm:min-h-[13.5rem]`}
        >
          <ImageWithFallback
            src={post.image}
            alt={post.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/[0.04] via-transparent to-black/[0.14]" />

          {post.status === "SOLD" && (
            <div className="absolute left-3 top-3 z-10">
              <Badge className="border-white/35 bg-slate-950/55 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/40">
                {labels.soldOut}
              </Badge>
            </div>
          )}

          <div className="absolute bottom-3 right-3 z-10">
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
          className="pointer-events-auto absolute right-5 top-5 z-30 h-9 w-9"
        />
      )}

      <div className="pointer-events-none relative z-20 flex flex-1 flex-col justify-between px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
        <div>
          <div className="mb-3 flex items-start justify-between gap-4">
            <h3 className="line-clamp-2 text-[1.24rem] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground transition-colors group-hover:text-primary sm:text-[1.42rem]">
              {post.name}
            </h3>
          </div>

          {hasDescription && (
            <p className="mb-3 line-clamp-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[0.98rem]">
              {post.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground">
            <div className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-muted/55 px-2.5 py-1">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary/80" />
              <span className="truncate">{detailLocation}</span>
            </div>

            {post.condition && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/55 px-2.5 py-1">
                <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-primary/75" />
                <span>{post.condition}</span>
              </div>
            )}

            {postedAgo && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/55 px-2.5 py-1">
                <Clock3 className="h-3.5 w-3.5 flex-shrink-0 text-primary/75" />
                <span>{postedAgo}</span>
              </div>
            )}

            {typeof post.views === "number" && post.views > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/55 px-2.5 py-1">
                <Eye className="h-3.5 w-3.5 flex-shrink-0 text-primary/75" />
                <span>
                  {post.views} {labels.views}
                </span>
              </div>
            )}

            {hasSellerRating && (
              <div className="flex flex-shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
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
      </div>
    </article>
  );
});
