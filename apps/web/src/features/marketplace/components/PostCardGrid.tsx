import React from "react";
import { CardContent } from "../../../shared/ui/card";
import { Button } from "../../../shared/ui/button";
import { Badge } from "../../../shared/ui/badge";
import { Heart, MapPin, User, Eye } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { cn } from "../../../shared/ui/utils";
import { usePostCardState, type PostCardSharedProps } from "./usePostCardState";

export const PostCardGrid = React.memo(function PostCardGrid(props: PostCardSharedProps) {
  const { post, isFavorite = false, hideCategoryBadge } = props;
  const {
    isRTL,
    labels,
    priceLocale,
    showFavoriteButton,
    handleFavoriteClick,
    openPost,
  } = usePostCardState(props);

  return (
    <div className="group relative flex h-full transform flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 animate-fade-in backdrop-blur-sm card-shadow-brand focus-within:ring-2 focus-within:ring-primary/50 hover:-translate-y-1 hover:shadow-lg">
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
        />

        {!hideCategoryBadge && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="backdrop-blur-md border border-border/60 bg-background/95 px-2.5 py-1 text-xs text-primary shadow-sm sm:px-3 sm:py-1 sm:text-sm">
              <span className="line-clamp-1">{post.category}</span>
            </Badge>
          </div>
        )}

        {post.status === "SOLD" && (
          <div
            className={`absolute ${!hideCategoryBadge && showFavoriteButton ? "top-14" : "top-3"} right-3 z-10`}
          >
            <Badge className="backdrop-blur-md border border-border/60 bg-muted/95 px-2.5 py-1 text-xs text-muted-foreground shadow-sm font-semibold sm:px-3 sm:py-1 sm:text-sm">
              {labels.soldOut}
            </Badge>
          </div>
        )}

        {post.condition && post.status !== "SOLD" && (
          <div className="absolute bottom-3 left-3 z-10">
            <Badge className="backdrop-blur-md border border-border/60 bg-background/95 px-2 py-0.5 text-xs text-foreground shadow-sm">
              {post.condition}
            </Badge>
          </div>
        )}
      </button>

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
});
