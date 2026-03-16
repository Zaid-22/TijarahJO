import { deferredToast } from "../../../utils/toast";
import { resolveDocumentLanguage } from "../../../shared/lib/locale";
import type { Language, Post } from "../../../types";

export interface PostCardSharedProps {
  post: Post;
  onPostClick?: (postId: string) => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (postId: string) => void;
  isAuthenticated?: boolean;
  currentUserId?: string;
  hideCategoryBadge?: boolean;
  language?: Language;
  onRequireAuth?: () => void;
}

export function usePostCardState({
  post,
  isFavorite = false,
  isAuthenticated = false,
  currentUserId,
  language,
  onFavoriteToggle,
  onPostClick,
  onRequireAuth,
}: PostCardSharedProps) {
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

  const normalizedCurrentUserId = String(currentUserId || "").trim();
  const normalizedSellerId = String(post.sellerId || "").trim();
  const isOwner =
    normalizedCurrentUserId.length > 0 &&
    normalizedSellerId.length > 0 &&
    normalizedCurrentUserId === normalizedSellerId;
  const showFavoriteButton = !isOwner;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated) {
      if (onRequireAuth) {
        onRequireAuth();
      } else {
        deferredToast.error(labels.loginRequiredTitle, {
          description: labels.loginRequiredDescription,
          duration: 3000,
        });
      }
      return;
    }
    onFavoriteToggle?.(post.id);
  };

  const openPost = () => {
    onPostClick?.(post.id);
  };

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    if (post.phone) {
      window.location.href = `tel:${post.phone}`;
    }
  };

  const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    openPost();
  };

  return {
    resolvedLanguage,
    isRTL,
    labels,
    priceLocale,
    showFavoriteButton,
    handleFavoriteClick,
    handleCallClick,
    handleMessageClick,
    openPost,
  };
}
