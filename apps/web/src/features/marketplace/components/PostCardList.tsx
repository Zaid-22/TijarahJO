import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "../../../shared/ui/badge";
import { Button } from "../../../shared/ui/button";
import {
  Clock3,
  Eye,
  Heart,
  MessageCircle,
  Phone,
  Sparkles,
  Star,
} from "lucide-react";
import { APP_ROUTE_BUILDERS } from "../../../app/routes/routeConfig";
import { buildCurrentPath } from "../../../shared/lib/backNavigation";
import { formatPostedAgo } from "../../post-details/postDetailsUtils";
import { ImageWithFallback } from "./ImageWithFallback";
import { PostCardPriceBadge } from "./PostCardPriceBadge";
import { postCardMediaClass } from "./postCardMediaClass";
import { usePostCardState, type PostCardSharedProps } from "./usePostCardState";

function toLocalJordanMaskedPhone(value: string, fallback: string): string {
  const digitsOnly = value.replace(/\D/g, "");
  if (digitsOnly === "") {
    return fallback;
  }

  let localDigits = digitsOnly;

  if (localDigits.startsWith("962") && localDigits.length >= 12) {
    localDigits = "0" + localDigits.slice(3);
  } else if (localDigits.startsWith("7") && localDigits.length === 9) {
    localDigits = "0" + localDigits;
  }

  if (localDigits.length >= 10) {
    return localDigits.slice(0, 8) + "XX";
  }

  if (localDigits.length > 2) {
    return localDigits.slice(0, Math.max(0, localDigits.length - 2)) + "XX";
  }

  return localDigits;
}

export const PostCardList = React.memo(function PostCardList(
  props: PostCardSharedProps,
) {
  const { post, isFavorite = false } = props;
  const navigate = useNavigate();
  const location = useLocation();
  const {
    labels,
    resolvedLanguage,
    priceLocale,
    showFavoriteButton,
    handleFavoriteClick,
    requireAuthForProtectedAction,
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
  const hasSellerRating = Boolean(
    typeof sellerAverageRating === "number" &&
      typeof sellerReviewCount === "number",
  );
  const postedAgo = formatPostedAgo(
    post.createdAt,
    Date.now(),
    resolvedLanguage,
    "",
  );
  const detailLocation = post.area
    ? post.location + ", " + post.area
    : post.location;
  const hasDescription = Boolean(post.description?.trim());
  const currentPath = buildCurrentPath(location.pathname, location.search);
  const trimmedSellerId = String(post.sellerId || "").trim();
  const trimmedPhone = String(post.phone || "").trim();
  const hasChatTarget = trimmedSellerId.length > 0;
  const hasPhone = trimmedPhone.length > 0;
  const maskedPhone = toLocalJordanMaskedPhone(trimmedPhone, labels.callButton);

  const handleChatClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();

    if (requireAuthForProtectedAction() === false) {
      return;
    }

    if (hasChatTarget) {
      navigate(APP_ROUTE_BUILDERS.chatUser(trimmedSellerId), {
        state: {
          fromPath: currentPath,
        },
      });
      return;
    }

    openPost();
  };

  const handleCallClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();

    if (hasPhone) {
      window.location.href = "tel:" + trimmedPhone;
      return;
    }

    openPost();
  };

  return (
    <article className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[24px] border border-border/60 bg-card shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:flex-row">
      <button
        type="button"
        onClick={openPost}
        aria-label={labels.viewDetailsAria}
        className="absolute inset-0 z-10 rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      />

      <div className="px-3 pt-3 sm:w-[19.5rem] sm:flex-shrink-0 sm:pb-3">
        <div
          className={
            postCardMediaClass +
            " pointer-events-none rounded-[20px] border border-border/40 bg-muted/30 aspect-[16/9] overflow-hidden shadow-[0_10px_24px_rgba(15,23,42,0.10)] sm:h-full sm:min-h-[13.5rem]"
          }
        >
          <ImageWithFallback
            src={post.image}
            alt={post.name}
            className="absolute inset-0 block h-full min-h-full w-full min-w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/[0.04] via-transparent to-black/[0.14]" />

          {post.status === "SOLD" && (
            <div className="absolute left-3 top-3 z-10">
              <Badge className="border-white/35 bg-slate-950/55 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/40">
                {labels.soldOut}
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

      <div className="pointer-events-none relative z-20 flex flex-1 flex-col justify-between px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
        <div>
          <div className="mb-3 flex items-start justify-between gap-4">
            <h3 className="line-clamp-1 text-[1.12rem] font-semibold leading-[1.15] tracking-[-0.015em] text-foreground sm:text-[1.26rem]">
              {post.name}
            </h3>
          </div>

          {hasDescription && (
            <p className="mb-3 line-clamp-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[0.98rem]">
              {post.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
            <div className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-slate-100/90 px-2.5 py-1 font-medium dark:bg-slate-800/80">
              <span className="truncate">{detailLocation}</span>
            </div>

            {post.condition && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 px-2.5 py-1 font-medium dark:bg-slate-800/80">
                <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-primary/85" />
                <span>{post.condition}</span>
              </div>
            )}

            {postedAgo && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 px-2.5 py-1 font-medium dark:bg-slate-800/80">
                <Clock3 className="h-3.5 w-3.5 flex-shrink-0 text-primary/85" />
                <span>{postedAgo}</span>
              </div>
            )}

            {typeof post.views === "number" && post.views > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 px-2.5 py-1 font-medium dark:bg-slate-800/80">
                <Eye className="h-3.5 w-3.5 flex-shrink-0 text-primary/85" />
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

        <div className="pointer-events-auto relative z-30 mt-4 flex items-stretch gap-2.5 sm:gap-3">
          <Button
            className="h-11 min-w-0 flex-[1.15] rounded-xl bg-primary px-3 sm:px-4 text-[0.95rem] font-bold text-primary-foreground shadow-sm hover:bg-primary/90 flex items-center justify-center gap-1.5 transition-colors"
            onClick={handleChatClick}
          >
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-200" />
            <span>{labels.chatButton}</span>
          </Button>

          <Button
            variant="outline"
            className="h-11 min-w-0 flex-[0.95] rounded-xl border-[1.5px] border-slate-300 bg-white px-3 sm:px-4 text-[0.92rem] font-semibold text-slate-700 shadow-none hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors"
            onClick={handleCallClick}
            disabled={hasPhone === false}
          >
            <Phone className="h-[1rem] w-[1rem] text-slate-500 dark:text-slate-400" />
            <span>{labels.callButton}</span>
          </Button>

          {showFavoriteButton ? (
            <button
              type="button"
              onClick={handleFavoriteClick}
              aria-label={labels.favoriteLabel}
              title={labels.favoriteLabel}
              className="inline-flex h-11 w-11 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50/80 text-rose-500 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 dark:border-white/10 dark:bg-slate-900/70 dark:hover:bg-slate-800 dark:text-rose-400"
            >
              <Heart
                className={
                  isFavorite
                    ? "h-5.5 w-5.5 fill-current stroke-[2.1]"
                    : "h-5.5 w-5.5 stroke-[2.1]"
                }
              />
            </button>
          ) : null}

          {hasPhone ? (
            <span className="sr-only" dir="ltr">
              {maskedPhone}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
});
