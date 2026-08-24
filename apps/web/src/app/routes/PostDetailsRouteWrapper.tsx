import { useLocation, useNavigate, useParams } from "react-router-dom";
import { SearchX } from "lucide-react";
import { PostDetailsPage } from "../../features/post-details/pages/PostDetailsPage";
import { Language, Post, UserProfile } from "../../types";
import { deferredToast } from "../../utils/toast";
import { resolveCurrentUserId } from "./appRoutesUtils";
import { PageShell } from "../../shared/ui/page-shell";
import { usePostDetailsRouteData } from "./usePostDetailsRouteData";
import type {
  UpdatePostInput,
  UpdatePostResult,
  UpdatePostStatusInput,
} from "./usePostActions";
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
  onFavoriteToggle: (postId: string) => void;
  onOpenPost: (postId: string) => void;
  onNavigateHome: () => void;
  onNavigateCategory: (categoryName: string, fromPath?: string) => void;
  onNavigateProfile: () => void;
  onNavigateSeller: (sellerId: string, fromPath?: string) => void;
  onNavigateChat: (sellerId: string, fromPath?: string, postTitle?: string) => void;
  onRequireAuth?: () => void;
  onUpdatePost: (updatedPost: UpdatePostInput) => Promise<UpdatePostResult>;
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
  onFavoriteToggle,
  onOpenPost,
  onNavigateHome,
  onNavigateCategory,
  onNavigateProfile,
  onNavigateSeller,
  onNavigateChat,
  onRequireAuth,
  onUpdatePost,
  onUpdatePostStatus,
  onDeletePost,
}: PostDetailsRouteWrapperProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    resolvedPost,
    isLoadingRoutePost,
    routePostError,
    retryRoutePost,
    isOwnPost,
    mutateRoutePost,
    replaceRoutePost,
  } = usePostDetailsRouteData({
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
    postLoadFailed:
      language === "ar"
        ? "تعذر تحميل المنشور. تحقق من اتصالك وحاول مرة أخرى."
        : "We couldn't load this post. Check your connection and try again.",
    tryAgain: language === "ar" ? "إعادة المحاولة" : "Try Again",
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
    if (routePostError) {
      return (
        <PageShell>
          <div className="flex h-[70vh] w-full flex-col items-center justify-center px-4">
            <div className="flex max-w-sm flex-col items-center text-center">
              <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">
                {labels.postLoadFailed}
              </h2>
              <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
                {routePostError}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button size="lg" onClick={retryRoutePost}>
                  {labels.tryAgain}
                </Button>
                <Button size="lg" variant="outline" onClick={onNavigateHome}>
                  {labels.goHome}
                </Button>
              </div>
            </div>
          </div>
        </PageShell>
      );
    }

    return (
      <PageShell>
        <div className="flex h-[70vh] w-full flex-col items-center justify-center px-4">
          <div className="flex flex-col items-center max-w-sm text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted/50 ring-8 ring-muted/20">
              <SearchX className="h-10 w-10 text-muted-foreground/60" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">
              {labels.postNotFound}
            </h2>
            <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
              {language === "ar" 
                ? "عذراً، هذا المنشور غير متوفر. قد يكون تم حذفه أو أنك لا تملك صلاحية للوصول إليه." 
                : "Sorry, this post is unavailable. It may have been deleted, or you might not have permission to view it."}
            </p>
            <Button
              size="lg"
              onClick={onNavigateHome}
              className="px-8 rounded-full shadow-sm hover:shadow-md transition-all"
            >
              {labels.goHome}
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PostDetailsPage
      post={resolvedPost}
      onBack={handleBack}
      allPosts={availablePosts}
      language={language}
      onPostClick={onOpenPost}
      onCategoryClick={(categoryName) =>
        onNavigateCategory(categoryName, currentPath)
      }
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
          onRequireAuth?.();
          return;
        }

        const currentUserId = resolveCurrentUserId(userProfile);
        if (currentUserId && currentUserId === targetSellerId) {
          deferredToast.error(labels.cannotChatWithSelf);
          return;
        }

        onNavigateChat(targetSellerId, currentPath, resolvedPost.name);
      }}
      isOwnPost={isOwnPost}
      onUpdatePost={async (updatedPost) => {
        try {
          const result = await onUpdatePost(updatedPost);
          replaceRoutePost(result.post);
          deferredToast.success(labels.postUpdated);
          if (result.message?.trim()) {
            deferredToast.error(result.message);
          }
        } catch (error) {
          deferredToast.error(
            error instanceof Error ? error.message : labels.updateError,
          );
          throw error;
        }
      }}
      onUpdatePostStatus={async (statusData) => {
        try {
          await onUpdatePostStatus(statusData);
          mutateRoutePost({ status: statusData.status as "ACTIVE" | "SOLD" | "DELETED" });
          deferredToast.success(labels.postUpdated);
        } catch (error) {
          deferredToast.error(
            error instanceof Error ? error.message : labels.updateError,
          );
          throw error;
        }
      }}
      onDeletePost={async (postId) => {
        try {
          await onDeletePost(postId);
          deferredToast.success(labels.postDeleted);
          onNavigateHome();
        } catch (error) {
          deferredToast.error(
            error instanceof Error ? error.message : labels.deleteError,
          );
          throw error;
        }
      }}
      favoriteIds={favoriteIds}
      onFavoriteToggle={onFavoriteToggle}
      isAuthenticated={isAuthenticated}
      onRequireAuth={onRequireAuth}
    />
  );
}
