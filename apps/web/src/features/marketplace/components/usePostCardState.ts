import { deferredToast } from "../../../utils/toast";
import { resolveDocumentLanguage } from "../../../shared/lib/locale";
import type { Language, Post, ViewMode } from "../../../types";

export interface PostCardSharedProps {
  post: Post;
  viewMode?: ViewMode;
  onPostClick?: (postId: string) => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (postId: string) => void;
  isAuthenticated?: boolean;
  currentUserId?: string;
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
  const labels = {
    loginRequiredTitle:
      resolvedLanguage === "ar"
        ? "يرجى تسجيل الدخول لإضافة المنشورات إلى المفضلة"
        : "Please log in to add posts to favorites",
    loginRequiredDescription:
      resolvedLanguage === "ar"
        ? "تحتاج إلى تسجيل الدخول لحفظ منشوراتك المفضلة"
        : "You need to be logged in to save your favorite posts",
    viewDetailsAria:
      resolvedLanguage === "ar"
        ? "عرض تفاصيل " + post.name
        : "View details for " + post.name,
    soldOut: resolvedLanguage === "ar" ? "تم البيع" : "SOLD OUT",
    currency: resolvedLanguage === "ar" ? "د.أ" : "JOD",
    views: resolvedLanguage === "ar" ? "مشاهدة" : "views",
    favoriteLabel: isFavorite
      ? resolvedLanguage === "ar"
        ? "إزالة " + post.name + " من المفضلة"
        : "Remove " + post.name + " from favorites"
      : resolvedLanguage === "ar"
        ? "إضافة " + post.name + " إلى المفضلة"
        : "Add " + post.name + " to favorites",
    chatButton: resolvedLanguage === "ar" ? "دردشة" : "Chat",
    callButton: resolvedLanguage === "ar" ? "اتصال" : "Call",
  };
  const priceLocale = resolvedLanguage === "ar" ? "ar-JO" : "en-US";

  const normalizedCurrentUserId = String(currentUserId || "").trim();
  const normalizedSellerId = String(post.sellerId || "").trim();
  const isOwner =
    normalizedCurrentUserId.length > 0 &&
    normalizedSellerId.length > 0 &&
    normalizedCurrentUserId === normalizedSellerId;
  const showFavoriteButton = isOwner ? false : Boolean(onFavoriteToggle);

  const requireAuthForProtectedAction = () => {
    if (isAuthenticated) {
      return true;
    }

    if (onRequireAuth) {
      onRequireAuth();
    } else {
      deferredToast.error(labels.loginRequiredTitle, {
        description: labels.loginRequiredDescription,
        duration: 3000,
      });
    }

    return false;
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (requireAuthForProtectedAction() === false) {
      return;
    }
    onFavoriteToggle?.(post.id);
  };

  const openPost = () => {
    onPostClick?.(post.id);
  };

  return {
    resolvedLanguage,
    labels,
    priceLocale,
    showFavoriteButton,
    handleFavoriteClick,
    requireAuthForProtectedAction,
    openPost,
  };
}
