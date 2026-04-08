import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "../../../shared/ui/badge";
import { Button } from "../../../shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../../shared/ui/dialog";
import {
  Clock3,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  Phone,
  Sparkles,
  Star,
} from "lucide-react";
import { APP_ROUTE_BUILDERS } from "../../../app/routes/routeConfig";
import { buildCurrentPath } from "../../../shared/lib/backNavigation";
import { formatPostedAgo } from "../../post-details/postDetailsUtils";
import { ImageWithFallback } from "./ImageWithFallback";
import { toThumbnailUrl } from "../../../shared/lib/thumbnail";
import { PostCardPriceBadge } from "./PostCardPriceBadge";
import { postCardMediaClass } from "./postCardMediaClass";
import { usePostCardState, type PostCardSharedProps } from "./usePostCardState";
import { api } from "../../../services/api";
import {
  resolvePhoneDialogCopy,
  type PhoneLookupStatus,
} from "./postCardPhoneDialog";

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
  const [resolvedPhone, setResolvedPhone] = useState("");
  const [isResolvingPhone, setIsResolvingPhone] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneLookupStatus, setPhoneLookupStatus] =
    useState<PhoneLookupStatus>("idle");
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
  const trimmedPhone = String(resolvedPhone || post.phone || "").trim();
  const hasChatTarget = trimmedSellerId.length > 0;
  const hasPhone = trimmedPhone.length > 0;
  const canResolvePhone = hasPhone || hasChatTarget;
  const maskedPhone = toLocalJordanMaskedPhone(trimmedPhone, labels.callButton);
  const phoneDialogCopy = resolvePhoneDialogCopy(
    resolvedLanguage,
    trimmedPhone,
    phoneLookupStatus,
  );

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

  const handleCallClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();

    if (hasPhone) {
      setPhoneLookupStatus("ready");
      setShowPhoneDialog(true);
      return;
    }

    if (trimmedSellerId.length > 0) {
      try {
        setIsResolvingPhone(true);
        const sellerProfile = await api.sellers.getSellerProfile(trimmedSellerId);
        if (!sellerProfile) {
          setPhoneLookupStatus("error");
          setShowPhoneDialog(true);
          return;
        }

        const matchedPost = sellerProfile?.posts?.find(
          (sellerPost) => String(sellerPost.id || "").trim() === String(post.id || "").trim(),
        );
        const sellerPhone = String(
          sellerProfile?.seller?.phone || matchedPost?.phone || "",
        ).trim();

        if (sellerPhone) {
          setResolvedPhone(sellerPhone);
          setPhoneLookupStatus("ready");
          setShowPhoneDialog(true);
          return;
        }
        setPhoneLookupStatus("unavailable");
      } catch {
        setPhoneLookupStatus("error");
      } finally {
        setIsResolvingPhone(false);
      }
    }

    setShowPhoneDialog(true);
  };

  return (
    <article className="group relative flex w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_20px_50px_-32px_rgba(15,23,42,0.35)] dark:border-slate-800/80 dark:bg-slate-900 sm:flex-row">
      <button
        type="button"
        onClick={openPost}
        aria-label={labels.viewDetailsAria}
        className="absolute inset-0 z-10 rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      />

      <div className="px-3 pt-3 sm:w-[13.25rem] sm:flex-shrink-0 sm:pb-3 xl:w-[14.25rem]">
        <div
          className={
            postCardMediaClass +
            " pointer-events-none rounded-[22px] border border-border/40 bg-muted/30 aspect-[16/9] overflow-hidden shadow-lg sm:h-full sm:min-h-[12.5rem]"
          }
        >
          <ImageWithFallback
            src={toThumbnailUrl(post.image) || post.image}
            fallbackSrc={post.image}
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

      <div className="pointer-events-none relative z-20 flex min-w-0 flex-1 flex-col justify-between px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5">
        <div>
          <div className="mb-3 flex items-start justify-between gap-4">
            <h3 className="line-clamp-2 text-base font-semibold leading-[1.12] tracking-[-0.018em] text-foreground sm:text-[1.3rem]">
              {post.name}
            </h3>
          </div>

          {hasDescription && (
            <p className="mb-3 line-clamp-2 max-w-none text-sm leading-6 text-muted-foreground sm:text-[1rem] sm:leading-7">
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

        <div className="pointer-events-auto relative z-30 mt-5 flex flex-wrap items-stretch gap-2.5 sm:inline-grid sm:w-auto sm:grid-cols-[9.5rem_10.5rem_auto] sm:gap-3">
          <Button
            variant="outline"
            className="flex h-10 min-w-0 flex-[0.92] basis-[calc(46%-0.5rem)] items-center justify-center gap-1.5 rounded-[18px] border-2 border-primary bg-white px-3 text-sm font-semibold text-primary shadow-[0_12px_26px_-24px_rgba(37,99,235,0.42)] transition-colors hover:bg-primary/[0.06] sm:basis-auto sm:px-3.5 dark:bg-slate-950 dark:text-primary-foreground"
            onClick={handleChatClick}
          >
            <MessageCircle className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            <span>{labels.chatButton}</span>
          </Button>

          <Button
            className="flex h-10 min-w-0 flex-[1.08] basis-[calc(54%-0.5rem)] items-center justify-center gap-1.5 rounded-[18px] bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-[0_14px_30px_-22px_rgba(37,99,235,0.8)] transition-colors hover:bg-primary/92 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-400 sm:basis-auto sm:px-3.5"
            onClick={handleCallClick}
            disabled={canResolvePhone === false || isResolvingPhone}
          >
            {isResolvingPhone ? (
              <Loader2 className="h-[1rem] w-[1rem] animate-spin text-primary-foreground" />
            ) : (
              <Phone className="h-[1rem] w-[1rem] text-primary-foreground" />
            )}
            <span>{labels.callButton}</span>
          </Button>

          {showFavoriteButton ? (
            <button
              type="button"
              onClick={handleFavoriteClick}
              aria-label={labels.favoriteLabel}
              title={labels.favoriteLabel}
              className={
                isFavorite
                  ? "inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[18px] border border-rose-200 bg-rose-50 text-rose-500 shadow-[0_12px_24px_-24px_rgba(244,63,94,0.6)] transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
                  : "inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[18px] border border-slate-200 bg-white text-slate-400 shadow-[0_10px_22px_-24px_rgba(15,23,42,0.3)] transition-colors hover:bg-slate-50 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 dark:border-white/10 dark:bg-slate-950 dark:text-slate-500 dark:hover:bg-slate-900 dark:hover:text-rose-300"
              }
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

      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">{phoneDialogCopy.title}</DialogTitle>
          <DialogDescription className="sr-only">
            {phoneDialogCopy.description}
          </DialogDescription>
          <div className="flex flex-col items-center justify-center space-y-6 p-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">{phoneDialogCopy.title}</h3>
              <p className="text-sm text-muted-foreground">
                {phoneDialogCopy.description}
              </p>
            </div>
            <div className="w-full pt-2">
              {phoneDialogCopy.canCall ? (
                <a
                  href={`tel:${trimmedPhone}`}
                  aria-label={`${phoneDialogCopy.callNowLabel} ${phoneDialogCopy.displayNumber}`}
                  className="flex h-[4.9rem] w-full items-center justify-between rounded-[22px] bg-primary px-5 text-primary-foreground shadow-[0_22px_50px_-28px_rgba(37,99,235,0.95)] transition-all hover:bg-primary/92 hover:shadow-[0_26px_58px_-28px_rgba(37,99,235,0.98)]"
                  dir="ltr"
                >
                  <span className="truncate pe-4 text-[1.95rem] font-extrabold tracking-[-0.03em]">
                    {phoneDialogCopy.displayNumber}
                  </span>
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/14">
                    <Phone className="h-6 w-6" />
                  </span>
                </a>
              ) : (
                <div
                  className="flex h-[4.9rem] w-full items-center justify-between rounded-[22px] border border-slate-200 bg-slate-100 px-5 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                  dir="ltr"
                >
                  <span className="truncate pe-4 text-[1.55rem] font-bold tracking-[-0.03em]">
                    {phoneDialogCopy.displayNumber}
                  </span>
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/70 dark:bg-slate-800">
                    <Phone className="h-6 w-6" />
                  </span>
                </div>
              )}
            </div>
            <div className="flex w-full flex-col gap-3 pt-1 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPhoneDialog(false)}
              >
                {phoneDialogCopy.closeLabel}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
});
