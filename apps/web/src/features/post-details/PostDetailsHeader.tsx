import { useEffect, useState } from "react";
import { Flag, Heart, Share2 } from "lucide-react";
import { Button } from "../../shared/ui/button";
import { SubpageHeader } from "../../shared/ui/subpage-header";
import { hasStoredAuthSessionHint } from "../../contexts/authContextUtils";
import type { Language, Post } from "../../types";

interface PostDetailsHeaderProps {
  post: Post;
  language: Language;
  isRTL: boolean;
  isAuthenticated: boolean;
  isOwnPost?: boolean;
  isFavorited: boolean;
  onBack: () => void;
  onFavoriteToggle?: (postId: string) => void;
  onRequireAuth?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  backToListingsLabel: string;
}

export function PostDetailsHeader({
  post,
  language,
  isRTL,
  isAuthenticated,
  isOwnPost,
  isFavorited,
  onBack,
  onFavoriteToggle,
  onRequireAuth,
  onShare,
  onReport,
  backToListingsLabel,
}: PostDetailsHeaderProps) {
  const [optimisticFavorited, setOptimisticFavorited] = useState(isFavorited);

  useEffect(() => {
    setOptimisticFavorited(isFavorited);
  }, [isFavorited]);

  const resolvedFavorited = optimisticFavorited;
  const canUseAuthenticatedActions =
    isAuthenticated || hasStoredAuthSessionHint();
  const actionButtons = (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 rounded-lg p-0 transition-all duration-200 hover:scale-110 hover:bg-background hover:shadow-sm sm:h-10 sm:w-10"
        title={language === "ar" ? "مشاركة" : "Share"}
        aria-label={
          language === "ar" ? "مشاركة هذا المنشور" : "Share this post"
        }
        onClick={onShare}
      >
        <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
      </Button>

      {!isOwnPost && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 rounded-lg p-0 transition-all duration-200 hover:scale-110 hover:bg-background hover:shadow-sm sm:h-10 sm:w-10"
          onClick={() => {
            if (!canUseAuthenticatedActions) {
              onRequireAuth?.();
              return;
            }

            onReport?.();
          }}
          title={language === "ar" ? "الإبلاغ عن الإعلان" : "Report listing"}
          aria-label={
            language === "ar" ? "الإبلاغ عن هذا الإعلان" : "Report this listing"
          }
        >
          <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
        </Button>
      )}

      {!isOwnPost && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 rounded-lg p-0 transition-all duration-200 hover:scale-110 hover:bg-background hover:shadow-sm sm:h-10 sm:w-10"
          onClick={() => {
            if (!canUseAuthenticatedActions) {
              onRequireAuth?.();
              return;
            }

            setOptimisticFavorited((previousValue) => !previousValue);
            onFavoriteToggle?.(post.id);
          }}
          title={resolvedFavorited ? "Remove from favorites" : "Add to favorites"}
          aria-label={
            resolvedFavorited
              ? language === "ar"
                ? "إزالة من المفضلة"
                : "Remove from favorites"
              : language === "ar"
                ? "إضافة إلى المفضلة"
                : "Add to favorites"
          }
        >
          <Heart
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 text-red-500 ${
              resolvedFavorited ? "fill-current scale-110" : ""
            }`}
          />
        </Button>
      )}
    </div>
  );

  return (
    <SubpageHeader
      onBack={onBack}
      isRTL={isRTL}
      backLabel={backToListingsLabel}
      showLogo
      onLogoClick={onBack}
      rightContent={actionButtons}
      contentClassName="py-3 sm:py-4"
    />
  );
}
