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
  Scale,
  Sparkles,
  Star,
} from "lucide-react";
import { APP_ROUTE_BUILDERS } from "../../../app/routes/routeConfig";
import { buildCurrentPath } from "../../../shared/lib/backNavigation";
import { formatPostedAgo } from "../../post-details/postDetailsUtils";
import { ImageWithFallback } from "./ImageWithFallback";
import { getResponsiveImageProps } from "../../../shared/lib/thumbnail";
import { PostCardPriceBadge } from "./PostCardPriceBadge";
import { postCardMediaClass } from "./postCardMediaClass";

import { usePostCardState, type PostCardSharedProps } from "./usePostCardState";
import { useCompare } from "../../../contexts/CompareContext";
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
  const imageProps = getResponsiveImageProps(post.image, {
    width: 520,
    aspectRatio: 16 / 10,
    quality: 60,
    widths: [320, 420, 520],
    sizes: "(max-width: 639px) 92vw, (max-width: 1279px) 220px, 240px",
  });
  const [resolvedPhone, setResolvedPhone] = useState("");
  const [isResolvingPhone, setIsResolvingPhone] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneLookupStatus, setPhoneLookupStatus] =
    useState<PhoneLookupStatus>("idle");
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
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
  const isArabic = resolvedLanguage === "ar";
  const displayLocation = isArabic ? post.locationAr || post.location : post.location;
  const displayArea = isArabic ? post.areaAr || post.area : post.area;
  const separator = isArabic ? "، " : ", ";
  const detailLocation = displayArea ? displayLocation + separator + displayArea : displayLocation;
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
    <article className="group relative flex w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-lg dark:border-slate-800/80 dark:bg-slate-900 sm:flex-row">
      <button
        type="button"
        onClick={openPost}
        aria-label={labels.viewDetailsAria}
        className="absolute inset-0 z-10 rounded-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      />

      <div className="px-3 pt-3 sm:w-53 sm:shrink-0 sm:pb-3 xl:w-58">
        <div
          className={
            postCardMediaClass +
            " pointer-events-none rounded-[16px] border border-border/40 bg-muted/30 aspect-16/10 overflow-hidden shadow-md sm:h-full sm:min-h-50"
          }
        >
          <ImageWithFallback
            src={imageProps.src || post.image}
            srcSet={imageProps.srcSet}
            sizes={imageProps.sizes}
            fallbackSrc={post.image}
            alt={post.name}
            width={420}
            height={236}
            className="absolute inset-0 block h-full min-h-full w-full min-w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/3 via-transparent to-black/10" />

          {post.status === "SOLD" && (
            <div className="absolute left-3 top-3 z-10">
              <Badge className="border-white/35 bg-slate-950/55 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md supports-backdrop-filter:bg-slate-950/40">
                {labels.soldOut}
              </Badge>
            </div>
          )}

        </div>
      </div>

      <div className="pointer-events-none relative z-20 flex min-w-0 flex-1 flex-col justify-between px-4 pb-4 pt-4 sm:px-5 sm:pb-4 sm:pt-4.5">
        <div>
          <div className="mb-2.5">
            <PostCardPriceBadge
              price={post.price}
              currency={labels.currency}
              locale={priceLocale}
              className="mb-2 shrink-0 border-white/45 bg-white/94 text-slate-950 shadow-md supports-backdrop-filter:bg-white/86 px-2 py-0.5 scale-95"
            />

            <h3 className="line-clamp-2 text-base font-semibold leading-[1.12] tracking-[-0.018em] text-foreground sm:text-lg">
              {post.name}
            </h3>

            {hasDescription && (
              <p className="mt-2 line-clamp-2 max-w-none text-sm leading-6 text-muted-foreground">
                {post.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <div className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-slate-100/90 px-2.5 py-1 font-medium dark:bg-slate-800/80">
              <span className="truncate">{detailLocation || "-"}</span>
            </div>

            {post.condition && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 px-2.5 py-1 font-medium dark:bg-slate-800/80">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                <span>{post.condition}</span>
              </div>
            )}

            {postedAgo && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 px-2.5 py-1 font-medium dark:bg-slate-800/80">
                <Clock3 className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                <span>{postedAgo}</span>
              </div>
            )}

            {typeof post.views === "number" && post.views > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 px-2.5 py-1 font-medium dark:bg-slate-800/80">
                <Eye className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                <span>
                  {post.views} {labels.views}
                </span>
              </div>
            )}

            {hasSellerRating && (
              <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
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

        <div className="pointer-events-auto relative z-30 mt-4 flex flex-wrap items-stretch gap-2.5 sm:inline-grid sm:w-auto sm:grid-cols-[9.5rem_10.5rem_auto] sm:gap-3">
          <Button
            variant="outline"
            aria-label={labels.chatButton}
            title={labels.chatButton}
            className="flex h-11 min-w-0 flex-[0.92] basis-[calc(46%-0.5rem)] items-center justify-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-none transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:basis-auto sm:px-4"
            onClick={handleChatClick}
          >
            <MessageCircle className="h-[1.2rem] w-[1.2rem] text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400" />
            <span>{labels.chatButton}</span>
          </Button>

          <Button
            aria-label={labels.callButton}
            title={labels.callButton}
            className="flex h-11 min-w-0 flex-[1.08] basis-[calc(54%-0.5rem)] items-center justify-center gap-2 rounded-[16px] bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-none transition-colors hover:bg-primary/92 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-400 sm:basis-auto sm:px-4"
            onClick={handleCallClick}
            disabled={canResolvePhone === false || isResolvingPhone}
          >
            {isResolvingPhone ? (
              <Loader2 className="h-[1.2rem] w-[1.2rem] animate-spin text-primary-foreground" />
            ) : (
              <Phone className="h-[1.05rem] w-[1.05rem] text-primary-foreground" />
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
                  ? "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-rose-200 bg-rose-50 text-rose-500 shadow-none transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
                  : "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-slate-200 bg-white text-slate-400 shadow-none transition-colors hover:bg-slate-50 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 dark:border-white/10 dark:bg-slate-950 dark:text-slate-500 dark:hover:bg-slate-900 dark:hover:text-rose-300"
              }
            >
              <Heart
                className={
                  isFavorite
                    ? "h-5 w-5 fill-current stroke-[2.1]"
                    : "h-5 w-5 stroke-[2.1]"
                }
              />
            </button>
          ) : null}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (requireAuthForProtectedAction() === false) {
                return;
              }
              const comparePost = {
                id: String(post.id),
                name: post.name,
                price: post.price ?? 0,
                image: post.image ?? "",
                category: post.category ?? "",
                categoryId: post.categoryId || "",
                location: detailLocation || post.location || "",
              };
              if (isInCompare(comparePost.id)) {
                removeFromCompare(comparePost.id);
              } else {
                addToCompare(comparePost);
              }
            }}
            aria-label={isInCompare(String(post.id)) ? "Remove from comparison" : "Add to comparison"}
            title={isInCompare(String(post.id)) ? "Remove from comparison" : "Add to comparison"}
            className={
              isInCompare(String(post.id))
                ? "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-primary/30 bg-primary/10 text-primary shadow-none transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                : "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-slate-200 bg-white text-slate-400 shadow-none transition-colors hover:bg-slate-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 dark:border-white/10 dark:bg-slate-950 dark:text-slate-500 dark:hover:bg-slate-900 dark:hover:text-primary"
            }
          >
            <Scale className="h-5 w-5" />
          </button>

          {hasPhone ? (
            <span className="sr-only" dir="ltr">
              {maskedPhone}
            </span>
          ) : null}
        </div>
      </div>

      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent 
          hideCloseButton
          className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl"
        >
          <DialogTitle className="sr-only">{phoneDialogCopy.title}</DialogTitle>
          <DialogDescription className="sr-only">
            {phoneDialogCopy.description}
          </DialogDescription>
          <div className="flex flex-col">
            <div className="bg-muted/30 px-6 pt-8 pb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                {phoneDialogCopy.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {phoneDialogCopy.description}
              </p>
            </div>

            <div className="px-6 py-6 pb-8">
              {phoneDialogCopy.canCall ? (
                <a
                  href={`tel:${trimmedPhone}`}
                  aria-label={`${phoneDialogCopy.callNowLabel} ${phoneDialogCopy.displayNumber}`}
                  className="group relative flex h-16 w-full items-center justify-between overflow-hidden rounded-2xl bg-primary px-6 text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
                  dir="ltr"
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs uppercase tracking-widest opacity-70 font-semibold mb-0.5">
                      {resolvedLanguage === "ar" ? "رقم الهاتف" : "Phone Number"}
                    </span>
                    <span className="text-2xl font-bold tracking-tight">
                      {phoneDialogCopy.displayNumber}
                    </span>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 transition-transform group-hover:rotate-12">
                    <Phone className="h-5 w-5" />
                  </div>
                </a>
              ) : (
                <div
                  className="flex h-16 w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                  dir="ltr"
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs uppercase tracking-widest opacity-50 font-semibold mb-0.5">
                      {resolvedLanguage === "ar" ? "رقم الهاتف" : "Phone Number"}
                    </span>
                    <span className="text-xl font-bold tracking-tight">
                      {phoneDialogCopy.displayNumber}
                    </span>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                    <Phone className="h-5 w-5 opacity-40" />
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                className="mt-4 w-full text-muted-foreground hover:text-foreground font-medium"
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
