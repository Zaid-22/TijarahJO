import { useLocation, useNavigate, useParams } from "react-router-dom";
import { PostDetailsPage } from "../../features/post-details/pages/PostDetailsPage";
import { Language, Post, UserProfile } from "../../types";
import { deferredToast } from "../../utils/toast";
import { resolveCurrentUserId } from "./appRoutesUtils";
import { PageShell } from "../../shared/ui/page-shell";
import { usePostDetailsRouteData } from "./usePostDetailsRouteData";
import { UpdatePostInput, UpdatePostStatusInput } from "./usePostActions";
import { Button } from "../../shared/ui/button";
import {
  buildCurrentPath,
  resolveBackPathFromLocationState,
} from "../../shared/lib/backNavigation";
import { LoadingState } from "../../shared/ui/loading-state";

interface PostDetailsRouteWrapperProps {
  language: Language;
  availablePosts: Post[];
  isLoadingPosts: boolean;
  isAuthenticated: boolean;
  userProfile: UserProfile;
  favoriteIds: string[];
  currentUserDisplayName: string;
  onFavoriteToggle: (postId: string) => void;
  onOpenPost: (postId: string) => void;
  onNavigateHome: () => void;
  onNavigateProfile: () => void;
  onNavigateSeller: (sellerId: string, fromPath?: string) => void;
  onNavigateChat: (sellerId: string, fromPath?: string) => void;
  onNavigateLogin: () => void;
  onRequireAuth?: () => void;
  onUpdatePost: (updatedPost: UpdatePostInput) => Promise<void>;
  onUpdatePostStatus: (statusData: UpdatePostStatusInput) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
}

export function PostDetailsRouteWrapper({
  language,
  availablePosts,
  isLoadingPosts,
  isAuthenticated,
  userProfile,
  favoriteIds,
  currentUserDisplayName,
  onFavoriteToggle,
  onOpenPost,
  onNavigateHome,
  onNavigateProfile,
  onNavigateSeller,
  onNavigateChat,
  onNavigateLogin,
  onRequireAuth,
  onUpdatePost,
  onUpdatePostStatus,
  onDeletePost,
}: PostDetailsRouteWrapperProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedPost, isLoadingRoutePost, isOwnPost } =
    usePostDetailsRouteData({
      id,
      availablePosts,
      isLoadingPosts,
      isAuthenticated,
      userProfile,
    });
  const labels = {
    loadingPost:
      language === "ar" ? "جارٍ تحميل المنشور..." : "Loading post...",
    postNotFound: language === "ar" ? "المنشور غير موجود." : "Post not found.",
    goHome: language === "ar" ? "العودة للرئيسية" : "Go Home",
    sellerProfileUnavailable:
      language === "ar" ? "ملف البائع غير متاح" : "Seller profile unavailable",
    sellerChatUnavailable:
      language === "ar" ? "محادثة البائع غير متاحة" : "Seller chat unavailable",
    cannotChatWithSelf:
      language === "ar"
        ? "لا يمكنك مراسلة نفسك"
        : "You cannot chat with yourself",
    postUpdated: language === "ar" ? "تم تحديث المنشور" : "Post updated",
    updateError: language === "ar" ? "حدث خطأ أثناء التحديث" : "Error updating",
    postDeleted: language === "ar" ? "تم حذف المنشور" : "Post deleted",
    deleteError: language === "ar" ? "حدث خطأ أثناء الحذف" : "Error deleting",
  };
  const currentPath = buildCurrentPath(location.pathname, location.search);
  const safeBackPath = resolveBackPathFromLocationState({
    locationState: location.state,
    currentPath,
    fallbackPath: "/",
  });
  const handleBack = () => {
    if (safeBackPath !== "/") {
      navigate(safeBackPath);
      return;
    }

    onNavigateHome();
  };

  if (isLoadingRoutePost) {
    return (
      <PageShell>
        <div className="h-16 w-full border-b border-border bg-card" />
        <LoadingState
          label={labels.loadingPost}
          minHeightClassName="min-h-[80vh]"
        />
      </PageShell>
    );
  }

  if (!resolvedPost) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        {labels.postNotFound}{" "}
        <Button
          variant="link"
          onClick={onNavigateHome}
          className="text-primary"
        >
          {labels.goHome}
        </Button>
      </div>
    );
  }

  return (
    <PostDetailsPage
      post={resolvedPost}
      onBack={handleBack}
      allPosts={availablePosts}
      language={language}
      onPostClick={onOpenPost}
      onSellerClick={() => {
        if (isOwnPost) {
          onNavigateProfile();
          return;
        }

        const targetSellerId = String(resolvedPost.sellerId || "").trim();
        if (!targetSellerId) {
          deferredToast.error(labels.sellerProfileUnavailable);
          return;
        }

        onNavigateSeller(targetSellerId, currentPath);
      }}
      onChatWithSeller={() => {
        const targetSellerId = String(resolvedPost.sellerId || "").trim();
        if (!targetSellerId) {
          deferredToast.error(labels.sellerChatUnavailable);
          return;
        }

        if (!isAuthenticated) {
          onNavigateLogin();
          return;
        }

        const currentUserId = resolveCurrentUserId(userProfile);
        if (currentUserId && currentUserId === targetSellerId) {
          deferredToast.error(labels.cannotChatWithSelf);
          return;
        }

        onNavigateChat(targetSellerId, currentPath);
      }}
      isOwnPost={isOwnPost}
      onUpdatePost={async (updatedPost) => {
        try {
          await onUpdatePost(updatedPost);
          deferredToast.success(labels.postUpdated);
        } catch {
          deferredToast.error(labels.updateError);
        }
      }}
      onUpdatePostStatus={async (statusData) => {
        try {
          await onUpdatePostStatus(statusData);
          deferredToast.success(labels.postUpdated);
        } catch {
          deferredToast.error(labels.updateError);
        }
      }}
      onDeletePost={async (postId) => {
        try {
          await onDeletePost(postId);
          deferredToast.success(labels.postDeleted);
          onNavigateHome();
        } catch {
          deferredToast.error(labels.deleteError);
        }
      }}
      favoriteIds={favoriteIds}
      onFavoriteToggle={onFavoriteToggle}
      isAuthenticated={isAuthenticated}
      currentUserDisplayName={currentUserDisplayName}
      onRequireAuth={onRequireAuth}
    />
  );
}
