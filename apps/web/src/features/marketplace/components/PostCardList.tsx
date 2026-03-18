import React from "react";
import { Button } from "../../../shared/ui/button";
import { Badge } from "../../../shared/ui/badge";
import { Heart, Phone, MessageCircle } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { usePostCardState, type PostCardSharedProps } from "./usePostCardState";

export const PostCardList = React.memo(function PostCardList(props: PostCardSharedProps) {
  const { post, isFavorite = false, hideCategoryBadge } = props;
  const {
    isRTL,
    labels,
    priceLocale,
    showFavoriteButton,
    handleFavoriteClick,
    handleCallClick,
    handleMessageClick,
    openPost,
  } = usePostCardState(props);

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 sm:flex-row hover:shadow-md focus-within:ring-2 focus-within:ring-primary/50 relative">
      <button
        type="button"
        onClick={openPost}
        aria-label={labels.viewDetailsAria}
        title={labels.viewDetails}
        className="relative w-full sm:w-72 aspect-[4/3] sm:aspect-auto overflow-hidden flex-shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ImageWithFallback
          src={post.image}
          alt={post.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {!hideCategoryBadge && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="backdrop-blur-md border hover:bg-background/95 border-border/60 bg-background/95 px-3 py-1 text-foreground shadow-sm">
              {post.category}
            </Badge>
          </div>
        )}

        {post.status === "SOLD" && (
          <div className={`absolute ${!hideCategoryBadge ? "top-14" : "top-3"} right-3 z-10`}>
            <Badge className="backdrop-blur-md border border-border/60 bg-muted/95 px-3 py-1 text-muted-foreground shadow-sm font-semibold">
              {labels.soldOut}
            </Badge>
          </div>
        )}
      </button>

      <div 
        className="flex-1 p-4 sm:p-5 flex flex-col justify-between cursor-pointer" 
        onClick={openPost}
        role="button"
        tabIndex={0}
        aria-label={labels.viewDetailsAria}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPost();
          }
        }}
      >
        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground transition-colors group-hover:text-primary line-clamp-2 leading-tight">
              {post.name}
            </h3>
          </div>

          <div className="mb-4 space-y-2">
            <p className="text-foreground text-sm sm:text-base font-medium">
              {[post.category, post.condition].filter(Boolean).join(" ، ")}
            </p>

            <div className="flex items-center text-muted-foreground text-sm">
              <span>
                {post.location}
                {post.area ? `، ${post.area}` : ""}
              </span>
            </div>
          </div>
        </div>

        <div 
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 pt-4 border-t border-border gap-4" 
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <div className="flex items-center text-foreground font-bold whitespace-nowrap">
            <span className="text-2xl sm:text-3xl leading-none">
              {post.price.toLocaleString(priceLocale)}
            </span>
            <span className="text-lg ms-1.5 pt-1">
              {labels.currency}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {showFavoriteButton && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleFavoriteClick}
                className="h-[42px] w-[42px] shrink-0 rounded-lg border-border hover:bg-muted"
                aria-label={labels.favoriteLabel}
                title={labels.favoriteLabel}
              >
                <Heart
                  className={`w-5 h-5 transition-all duration-200 text-red-600 dark:text-red-500 stroke-2 ${
                    isFavorite ? "fill-current" : "fill-none"
                  }`}
                />
              </Button>
            )}

            <Button
              variant="outline"
              className="h-[42px] flex-1 sm:flex-none px-4 sm:px-6 rounded-lg border-[1.5px] border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-600/10 font-bold transition-colors text-base"
              title={isRTL ? "دردش" : "Message"}
              onClick={handleMessageClick}
            >
              <span className="me-2">{isRTL ? "دردش" : "Chat"}</span>
              <MessageCircle className="w-5 h-5 fill-current" />
            </Button>

            <Button
              className="h-[42px] flex-1 sm:flex-none px-4 sm:px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors text-base"
              title={isRTL ? "اتصال" : "Call"}
              onClick={handleCallClick}
            >
              <span className="me-2" dir="ltr">{post.phone || "079XXXXXXX"}</span>
              <Phone className="w-5 h-5 fill-current" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
