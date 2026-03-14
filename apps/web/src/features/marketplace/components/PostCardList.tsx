import React from "react";
import { Button } from "../../../shared/ui/button";
import { Badge } from "../../../shared/ui/badge";
import { Heart, MapPin, User, Eye } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { cn } from "../../../shared/ui/utils";
import { usePostCardState, type PostCardSharedProps } from "./usePostCardState";

export const PostCardList = React.memo(function PostCardList(props: PostCardSharedProps) {
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
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 animate-fade-in sm:flex-row backdrop-blur-sm card-shadow-brand focus-within:ring-2 focus-within:ring-primary/50 hover:shadow-lg">
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
        />

        {!hideCategoryBadge && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="backdrop-blur-md border border-border/60 bg-background/95 px-3 py-1 text-primary shadow-sm">
              {post.category}
            </Badge>
          </div>
        )}

        {post.status === "SOLD" && (
          <div
            className={`absolute ${!hideCategoryBadge && showFavoriteButton ? "top-16" : "top-3"} right-3 z-10`}
          >
            <Badge className="backdrop-blur-md border border-border/60 bg-muted/95 px-3 py-1 text-muted-foreground shadow-sm font-semibold">
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
});
