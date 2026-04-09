import React from "react";
import { Badge } from "../../../shared/ui/badge";
import { CardContent } from "../../../shared/ui/card";
import { Star } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { getResponsiveImageProps } from "../../../shared/lib/thumbnail";
import { PostCardFavoriteButton } from "./PostCardFavoriteButton";
import { CompareButton } from "./CompareButton";
import { PostCardPriceBadge } from "./PostCardPriceBadge";
import { postCardMediaClass } from "./postCardMediaClass";
import { usePostCardState, type PostCardSharedProps } from "./usePostCardState";

export const PostCardGrid = React.memo(function PostCardGrid(props: PostCardSharedProps) {
  const { post, isFavorite = false } = props;
  const imageProps = getResponsiveImageProps(post.image, {
    width: 480,
    aspectRatio: 4 / 5,
    quality: 60,
    widths: [240, 360, 480],
    sizes: resolveGridImageSizes(props.viewMode),
  });
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
  const hasSellerRating = sellerAverageRating !== null && sellerReviewCount !== null;
  const detailLocation = post.area ? post.location + ", " + post.area : post.location;

  return (
    <article className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[14px] bg-card shadow-[0_12px_28px_-20px_rgba(15,23,42,0.24)] ring-1 ring-black/5 dark:ring-white/5">
      <button
        type="button"
        onClick={openPost}
        aria-label={labels.viewDetailsAria}
        className="absolute inset-0 z-10 rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      />

      <div
        className={postCardMediaClass + " pointer-events-none relative aspect-[4/5] overflow-hidden bg-muted/30"}
      >
        <ImageWithFallback
          src={imageProps.src || post.image}
          srcSet={imageProps.srcSet}
          sizes={imageProps.sizes}
          fallbackSrc={post.image}
          alt={post.name}
          width={480}
          height={600}
          className="absolute inset-0 block h-full min-h-full w-full min-w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0)_42%,rgba(15,23,42,0.22)_100%)]" />

        <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-2.5">
          <div className="flex flex-wrap gap-1.5">
            {post.status === "SOLD" && (
              <Badge className="border-white/20 bg-slate-950/60 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/45">
                {labels.soldOut}
              </Badge>
            )}
            {post.condition && post.status !== "SOLD" && (
              <Badge className="border-white/45 bg-white/88 px-2 py-0.5 text-[10px] font-semibold text-slate-900 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
                {post.condition}
              </Badge>
            )}
          </div>

          {showFavoriteButton && (
            <div className="flex items-center gap-1.5">
              <CompareButton
                product={{
                  id: String(post.id),
                  name: post.name,
                  price: post.price ?? 0,
                  image: post.image ?? "",
                  category: post.category ?? "",
                }}
              />
              <PostCardFavoriteButton
                isFavorite={isFavorite}
                label={labels.favoriteLabel}
                onClick={handleFavoriteClick}
                className="pointer-events-auto z-30"
              />
            </div>
          )}
        </div>
      </div>

      <CardContent className="pointer-events-none relative z-20 flex flex-grow flex-col gap-2 px-2.5 pb-2.5 pt-2.5 sm:px-3 sm:pb-3">
        <div className="space-y-1.5">
          <h3 className="truncate text-sm font-semibold leading-tight text-foreground sm:text-[15px]">
            {post.name}
          </h3>
          <p className="truncate text-[10px] font-medium text-muted-foreground sm:text-[11px]">
            {detailLocation || post.location || "-"}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <PostCardPriceBadge
            price={post.price}
            currency={labels.currency}
            locale={priceLocale}
            className="shrink-0 border-white/45 bg-white/94 text-slate-950 shadow-[0_10px_18px_-14px_rgba(15,23,42,0.55)] supports-[backdrop-filter]:bg-white/86 px-2 py-0.5 scale-95"
          />

          {hasSellerRating ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>{sellerAverageRating?.toFixed(1)}</span>
              <span className="text-[10px] font-medium opacity-70">({sellerReviewCount})</span>
            </div>
          ) : (
            <div className="h-7" />
          )}
        </div>
      </CardContent>
    </article>
  );
});

function resolveGridImageSizes(viewMode: PostCardSharedProps["viewMode"]): string {
  switch (viewMode) {
    case "grid-2":
      return "(max-width: 639px) 92vw, 46vw";
    case "grid-3":
      return "(max-width: 639px) 92vw, (max-width: 1023px) 45vw, 30vw";
    case "grid-4":
      return "(max-width: 639px) 92vw, (max-width: 1023px) 45vw, (max-width: 1279px) 30vw, 23vw";
    case "list":
    default:
      return "(max-width: 639px) 92vw, 23vw";
  }
}
