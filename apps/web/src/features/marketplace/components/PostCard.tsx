import { CardContent } from "../../../shared/ui/card";
import { Button } from "../../../shared/ui/button";
import { Badge } from "../../../shared/ui/badge";
import { Heart, MapPin, User, Eye } from "lucide-react";

import { ImageWithFallback } from "./ImageWithFallback";
import { Language, Post } from "../../../types";
import { deferredToast } from "../../../utils/toast";
import { resolveDocumentLanguage } from "../../../shared/lib/locale";
import { cn } from "../../../shared/ui/utils";

interface PostCardProps {
  post: Post;
  onPostClick?: (postId: string) => void;
  viewMode?: "grid-4" | "grid-3" | "grid-2" | "list";
  isFavorite?: boolean;
  onFavoriteToggle?: (postId: string) => void;
  isAuthenticated?: boolean;
  currentUserDisplayName?: string; // Fallback owner check when sellerId is unavailable
  currentUserId?: string;
  hideCategoryBadge?: boolean; // Hide category badge when on category page
  language?: Language;
}

export function PostCard({
  post,
  onPostClick,
  viewMode = "grid-4",
  isFavorite = false,
  onFavoriteToggle,
  isAuthenticated = false,
  currentUserDisplayName: _currentUserDisplayName,
  currentUserId,
  hideCategoryBadge,
  language,
}: PostCardProps) {
  const resolvedLanguage = language || resolveDocumentLanguage();
  const isRTL = resolvedLanguage === "ar";
  const labels = {
    loginRequiredTitle:
      resolvedLanguage === "ar"
        ? "يرجى تسجيل الدخول لإضافة العناصر إلى المفضلة"
        : "Please log in to add items to favorites",
    loginRequiredDescription:
      resolvedLanguage === "ar"
        ? "تحتاج إلى تسجيل الدخول لحفظ العناصر المفضلة"
        : "You need to be logged in to save your favorite items",
    viewDetailsAria:
      resolvedLanguage === "ar"
        ? `عرض تفاصيل ${post.name}`
        : `View details for ${post.name}`,
    soldOut: resolvedLanguage === "ar" ? "تم البيع" : "SOLD OUT",
    viewDetails: resolvedLanguage === "ar" ? "عرض التفاصيل" : "View Details",
    view: resolvedLanguage === "ar" ? "عرض" : "View",
    currency: resolvedLanguage === "ar" ? "د.أ" : "JOD",
    favoriteLabel: isFavorite
      ? resolvedLanguage === "ar"
        ? `إزالة ${post.name} من المفضلة`
        : `Remove ${post.name} from favorites`
      : resolvedLanguage === "ar"
        ? `إضافة ${post.name} إلى المفضلة`
        : `Add ${post.name} to favorites`,
  };
  const priceLocale = resolvedLanguage === "ar" ? "ar-JO" : "en-US";

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated) {
      deferredToast.error(labels.loginRequiredTitle, {
        description: labels.loginRequiredDescription,
        duration: 3000,
      });
      return;
    }
    onFavoriteToggle?.(post.id);
  };

  const openPost = () => {
    onPostClick?.(post.id);
  };

  // Determine ownership by user ID only — display-name comparison is fragile.
  const normalizedCurrentUserId = String(currentUserId || "").trim();
  const normalizedSellerId = String(post.sellerId || "").trim();
  const isOwner =
    normalizedCurrentUserId.length > 0 &&
    normalizedSellerId.length > 0 &&
    normalizedCurrentUserId === normalizedSellerId;
  // Only show favorite button if authenticated AND not the owner
  const showFavoriteButton = isAuthenticated && !isOwner;

  const isListView = viewMode === "list";

  if (isListView) {
    // List View Layout
    return (
      <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 animate-fade-in sm:flex-row backdrop-blur-sm card-shadow-brand focus-within:ring-2 focus-within:ring-primary/50 hover:shadow-lg">
        {/* Post Image - Smaller in list view */}
        <button
          type="button"
          onClick={openPost}
          aria-label={labels.viewDetailsAria}
          title={labels.viewDetails}
          className="relative w-full sm:w-64 aspect-square overflow-hidden flex-shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ImageWithFallback
            src={post.image}
            alt={post.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            // onLoad={() => setIsImageLoaded(true)}
          />

          {/* Category Badge */}
          {!hideCategoryBadge && (
            <div className="absolute top-3 left-3 z-10">
              <Badge className="backdrop-blur-md border border-border/60 bg-background/95 px-3 py-1 text-primary shadow-sm">
                {post.category}
              </Badge>
            </div>
          )}

          {/* SOLD Badge */}
          {post.status === "SOLD" && (
            <div
              className={`absolute ${!hideCategoryBadge && isAuthenticated ? "top-16" : "top-3"} right-3 z-10`}
            >
              <Badge className="backdrop-blur-md border border-border/60 bg-muted/95 px-3 py-1 text-muted-foreground shadow-sm font-semibold">
                {labels.soldOut}
              </Badge>
            </div>
          )}

          {/* Condition Badge */}
          {post.condition && post.status !== "SOLD" && (
            <div className="absolute bottom-3 left-3 z-10">
              <Badge className="backdrop-blur-md border border-border/60 bg-background/95 px-2 py-0.5 text-xs text-foreground shadow-sm">
                {post.condition}
              </Badge>
            </div>
          )}
        </button>

        {/* Content - Expanded in list view */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h3 className="mb-2 text-foreground transition-colors group-hover:text-primary">
                  {post.name}
                </h3>
                <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-primary">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <span>
                      {post.location}
                      {post.area ? `, ${post.area}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-primary">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span>{post.seller}</span>
                  </div>
                </div>
              </div>

              {/* Favorite Button */}
              {showFavoriteButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFavoriteClick}
                  className="h-10 w-10 rounded-full hover:bg-muted"
                  aria-label={labels.favoriteLabel}
                  title={labels.favoriteLabel}
                >
                  <Heart
                    className={`w-5 h-5 transition-all duration-200 text-red-500 stroke-2 ${
                      isFavorite ? "fill-red-500" : "fill-none"
                    }`}
                  />
                </Button>
              )}
            </div>
          </div>

          {/* Price and Action */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <span className="text-3xl font-semibold text-foreground">
                {post.price.toLocaleString(priceLocale)}
              </span>
              <span
                className={cn(
                  "text-lg text-muted-foreground",
                  isRTL ? "mr-2" : "ml-2",
                )}
              >
                {labels.currency}
              </span>
            </div>
            <Button
              size="lg"
              className="px-8 shadow-md transition-all duration-300 hover:opacity-90 hover:shadow-lg"
              onClick={openPost}
              title={labels.viewDetails}
            >
              <Eye className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {labels.viewDetails}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Grid View Layout (default)
  return (
    <div className="group relative flex h-full transform flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 animate-fade-in backdrop-blur-sm card-shadow-brand focus-within:ring-2 focus-within:ring-primary/50 hover:-translate-y-1 hover:shadow-lg">
      {/* Post Image - Fixed aspect ratio 4:3 for better balance */}
      <button
        type="button"
        onClick={openPost}
        aria-label={labels.viewDetailsAria}
        title={labels.viewDetails}
        className="relative w-full overflow-hidden flex-shrink-0 aspect-[4/3] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ImageWithFallback
          src={post.image}
          alt={post.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          // onLoad={() => setIsImageLoaded(true)}
        />

        {/* Category Badge - Proper padding from edges */}
        {!hideCategoryBadge && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="backdrop-blur-md border border-border/60 bg-background/95 px-2.5 py-1 text-xs text-primary shadow-sm sm:px-3 sm:py-1 sm:text-sm">
              <span className="line-clamp-1">{post.category}</span>
            </Badge>
          </div>
        )}

        {/* SOLD Badge - Adjusted positioning for better spacing */}
        {post.status === "SOLD" && (
          <div
            className={`absolute ${!hideCategoryBadge && isAuthenticated ? "top-14" : "top-3"} right-3 z-10`}
          >
            <Badge className="backdrop-blur-md border border-border/60 bg-muted/95 px-2.5 py-1 text-xs text-muted-foreground shadow-sm font-semibold sm:px-3 sm:py-1 sm:text-sm">
              {labels.soldOut}
            </Badge>
          </div>
        )}

        {/* Condition Badge */}
        {post.condition && post.status !== "SOLD" && (
          <div className="absolute bottom-3 left-3 z-10">
            <Badge className="backdrop-blur-md border border-border/60 bg-background/95 px-2 py-0.5 text-xs text-foreground shadow-sm">
              {post.condition}
            </Badge>
          </div>
        )}
      </button>

      {/* Favorite Button */}
      {showFavoriteButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-background/90 backdrop-blur-md transition-all duration-200 hover:bg-muted/80 sm:h-10 sm:w-10"
          aria-label={labels.favoriteLabel}
          title={labels.favoriteLabel}
        >
          <Heart
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 text-red-500 stroke-2 ${
              isFavorite ? "fill-red-500" : "fill-none"
            }`}
          />
        </Button>
      )}

      <CardContent className="p-3 sm:p-4 md:p-5 flex flex-col flex-grow">
        <div className="mb-3 sm:mb-4 flex-grow">
          <h3 className="min-h-10 line-clamp-2 mb-2 text-base text-foreground transition-colors group-hover:text-primary sm:mb-3 sm:min-h-12 sm:text-lg">
            {post.name}
          </h3>
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
              <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-muted sm:h-5 sm:w-5">
                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              </div>
              <span className="truncate">
                {post.location}
                {post.area ? `, ${post.area}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
              <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-muted sm:h-5 sm:w-5">
                <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              </div>
              <span className="truncate">{post.seller}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-2 sm:pt-3">
          <div className={cn("flex-1 min-w-0", isRTL ? "ml-2" : "mr-2")}>
            <div className="flex flex-wrap items-baseline gap-1">
              <span className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">
                {post.price.toLocaleString(priceLocale)}
              </span>
              <span className="text-sm sm:text-base text-muted-foreground">
                {labels.currency}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            className="flex-shrink-0 px-3 text-xs shadow-md transition-all duration-300 hover:opacity-90 hover:shadow-lg sm:px-4 sm:text-sm md:px-6"
            onClick={openPost}
            title={labels.viewDetails}
          >
            <span className="hidden sm:inline">{labels.view}</span>
            <Eye className="w-4 h-4 sm:hidden" />
          </Button>
        </div>
      </CardContent>
    </div>
  );
}
