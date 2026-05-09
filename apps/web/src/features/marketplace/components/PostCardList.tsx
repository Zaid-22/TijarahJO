import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "../../../shared/ui/badge";
import { Button } from "../../../shared/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/ui/avatar";
import {
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

import { PostCardPhoneDialog } from "./PostCardPhoneDialog.tsx";

import { usePostCardState, type PostCardSharedProps } from "./usePostCardState";
import { useCompare } from "../../../contexts/CompareContext";
import { api } from "../../../services/api";
import { type PhoneLookupStatus } from "./postCardPhoneDialog";
import { resolveAvatarSrc, getAvatarInitial } from "../../../shared/lib/avatar";
import { normalizeSellerDisplayName } from "../../../utils/sellerDisplayName";

const sellerAvatarCache = new Map<string, string | null>();
const sellerAvatarRequestCache = new Map<string, Promise<string | null>>();

async function getSellerAvatar(sellerId: string): Promise<string | null> {
  const normalizedSellerId = sellerId.trim();
  if (!normalizedSellerId) {
    return null;
  }

  if (sellerAvatarCache.has(normalizedSellerId)) {
    return sellerAvatarCache.get(normalizedSellerId) ?? null;
  }

  const pendingRequest = sellerAvatarRequestCache.get(normalizedSellerId);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = api.sellers
    .getSellerProfile(normalizedSellerId)
    .then((sellerProfile) => {
      const avatar = String(sellerProfile?.seller?.avatar || "").trim() || null;
      sellerAvatarCache.set(normalizedSellerId, avatar);
      sellerAvatarRequestCache.delete(normalizedSellerId);
      return avatar;
    })
    .catch(() => {
      sellerAvatarRequestCache.delete(normalizedSellerId);
      return null;
    });

  sellerAvatarRequestCache.set(normalizedSellerId, request);
  return request;
}

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
  const [sellerAvatar, setSellerAvatar] = useState<string | null>(null);
  const [phoneLookupStatus, setPhoneLookupStatus] =
    useState<PhoneLookupStatus>("idle");
  // phoneLookupStatus is read by the setter calls; suppress TS6133
  void phoneLookupStatus;
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const {
    labels,
    resolvedLanguage,
    priceLocale,
    isOwner,
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
  const displayLocation = isArabic
    ? post.locationAr || post.location
    : post.location;
  const displayArea = isArabic ? post.areaAr || post.area : post.area;
  const separator = isArabic ? "، " : ", ";
  const detailLocation = displayArea
    ? displayLocation + separator + displayArea
    : displayLocation;
  const currentPath = buildCurrentPath(location.pathname, location.search);
  const trimmedSellerId = String(post.sellerId || "").trim();
  const sellerDisplayName = normalizeSellerDisplayName(
    post.seller,
    trimmedSellerId,
  );
  const trimmedPhone = String(resolvedPhone || post.phone || "").trim();
  const hasChatTarget = trimmedSellerId.length > 0;
  const hasPhone = trimmedPhone.length > 0;
  const canResolvePhone = hasPhone || hasChatTarget;
  const maskedPhone = toLocalJordanMaskedPhone(trimmedPhone, labels.callButton);

  useEffect(() => {
    let cancelled = false;

    if (!trimmedSellerId) {
      setSellerAvatar(null);
      return;
    }

    const cachedAvatar = sellerAvatarCache.get(trimmedSellerId);
    if (cachedAvatar !== undefined) {
      setSellerAvatar(cachedAvatar);
      return;
    }

    void getSellerAvatar(trimmedSellerId).then((avatar) => {
      if (!cancelled) {
        setSellerAvatar(avatar);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [trimmedSellerId]);

  const handleChatClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();

    if (isOwner) {
      return;
    }

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

  const handleCallClick = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
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
        const sellerProfile =
          await api.sellers.getSellerProfile(trimmedSellerId);
        if (!sellerProfile) {
          setPhoneLookupStatus("error");
          setShowPhoneDialog(true);
          return;
        }

        const matchedPost = sellerProfile?.posts?.find(
          (sellerPost) =>
            String(sellerPost.id || "").trim() === String(post.id || "").trim(),
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
            className="absolute inset-0 block h-full! w-full! max-w-none object-cover"
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
              variant="inline"
              className="mb-2 shrink-0"
            />

            <div className="space-y-1.5">
              <h3 className="line-clamp-2 text-base font-semibold leading-[1.12] tracking-[-0.018em] text-foreground sm:text-lg">
                {post.name}
              </h3>

              <div className="flex max-w-full items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Avatar className="h-7 w-7 border border-white/70 shadow-sm dark:border-white/10">
                  <AvatarImage
                    src={resolveAvatarSrc(sellerAvatar) || undefined}
                    alt={sellerDisplayName}
                  />
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {getAvatarInitial(sellerDisplayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{sellerDisplayName}</span>
              </div>
            </div>
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
                <span>{postedAgo}</span>
              </div>
            )}

            {typeof post.views === "number" && post.views > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 px-2.5 py-1 font-medium dark:bg-slate-800/80">
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

        <div className="pointer-events-auto relative z-30 mt-4 flex flex-wrap items-stretch gap-2.5">
          <Button
            aria-label={labels.chatButton}
            title={labels.chatButton}
            className="flex h-10 min-w-0 flex-[0.92] basis-[calc(46%-0.5rem)] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-38 sm:flex-[0_0_auto] sm:px-4"
            onClick={handleChatClick}
            disabled={isOwner}
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2.5} />
            <span>{labels.chatButton}</span>
          </Button>

          <Button
            variant="secondary"
            aria-label={labels.callButton}
            title={labels.callButton}
            className="flex h-10 min-w-0 flex-[1.08] basis-[calc(54%-0.5rem)] items-center justify-center gap-2 rounded-xl bg-primary/5 px-4 text-sm font-bold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-42 sm:flex-[0_0_auto] sm:px-4"
            onClick={handleCallClick}
            disabled={canResolvePhone === false || isResolvingPhone}
          >
            {isResolvingPhone ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Phone className="h-4 w-4" strokeWidth={2.5} />
            )}
            <span>{labels.callButton}</span>
          </Button>

          <div className="flex items-center gap-2.5 sm:flex-[0_0_auto]">
            {showFavoriteButton ? (
              <button
                type="button"
                onClick={handleFavoriteClick}
                aria-label={labels.favoriteLabel}
                title={labels.favoriteLabel}
                className={
                  isFavorite
                    ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 dark:bg-rose-500/10 dark:text-rose-400"
                    : "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                }
              >
                <Heart
                  className={
                    isFavorite
                      ? "h-4 w-4 fill-current stroke-[2.5]"
                      : "h-4 w-4 stroke-[2.5]"
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
                  views: post.views,
                  averageRating: sellerAverageRating || undefined,
                  reviewCount: sellerReviewCount || undefined,
                  sellerId: post.sellerId || "",
                  sellerName: sellerDisplayName,
                  sellerAvatar,
                };
                if (isInCompare(comparePost.id)) {
                  removeFromCompare(comparePost.id);
                } else {
                  addToCompare(comparePost);
                }
              }}
              aria-label={
                isInCompare(String(post.id))
                  ? "Remove from comparison"
                  : "Add to comparison"
              }
              title={
                isInCompare(String(post.id))
                  ? "Remove from comparison"
                  : "Add to comparison"
              }
              className={
                isInCompare(String(post.id))
                  ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                  : "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              }
            >
              <Scale className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>

          {hasPhone ? (
            <span className="sr-only" dir="ltr">
              {maskedPhone}
            </span>
          ) : null}
        </div>
      </div>

      <PostCardPhoneDialog
        open={showPhoneDialog}
        onOpenChange={setShowPhoneDialog}
        phone={trimmedPhone}
        status={phoneLookupStatus}
        language={resolvedLanguage}
      />
    </article>
  );
});
