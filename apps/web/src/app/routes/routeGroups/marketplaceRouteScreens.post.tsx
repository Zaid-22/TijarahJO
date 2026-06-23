import { lazy, Suspense } from "react";
import { lazyImportWithRetry } from "../../../shared/lib/lazyImportWithRetry";
import { useMarketplaceRouteContext } from "./marketplaceRouteContext";
import { type MarketplaceRouteDefinition } from "./marketplaceRouteDefinitions";
import { APP_ROUTE_BUILDERS, APP_ROUTE_PATHS } from "../routeConfig";
import { deferredToast } from "../../../utils/toast";
import { LoadingState } from "../../../shared/ui/loading-state";


const SellerProfilePage = lazy(
  lazyImportWithRetry(
    () =>
      import("../../../features/seller-profile/pages/SellerProfilePage").then((m) => ({
        default: m.SellerProfilePage,
      })),
    "lazy-import-retry:seller-profile-page",
  ),
);
const PostDetailsRouteWrapper = lazy(
  lazyImportWithRetry(
    () =>
      import("../PostDetailsRouteWrapper").then((m) => ({
        default: m.PostDetailsRouteWrapper,
      })),
    "lazy-import-retry:post-details-route-wrapper",
  ),
);

function PostDetailsMarketplaceRouteScreen() {
  const {
    appProps,
    routeState,
    postActions,
    navigate,
    navigateToPost,
    sharedPostRouteProps,
    sharedUserRouteProps,
    promptLoginModal,
  } = useMarketplaceRouteContext();

  return (
    <Suspense fallback={<LoadingState minHeightClassName="min-h-96" />}>
      <PostDetailsRouteWrapper
        language={appProps.language}
        availablePosts={sharedPostRouteProps.availablePosts}
        isLoadingPosts={routeState.isLoadingPostsFromRouteData}
        isAuthenticated={sharedUserRouteProps.isAuthenticated}
        userProfile={appProps.userProfile}
        favoriteIds={sharedPostRouteProps.favoriteIds}
        onFavoriteToggle={sharedPostRouteProps.onFavoriteToggle}
        onOpenPost={(id) => navigateToPost(id, APP_ROUTE_PATHS.home)}
        onNavigateHome={() => navigate(APP_ROUTE_PATHS.home)}
        onNavigateCategory={(categoryName, fromPath) =>
          navigate(APP_ROUTE_BUILDERS.category(categoryName), {
            state: {
              fromPath: fromPath || APP_ROUTE_PATHS.home,
            },
          })
        }
        onNavigateProfile={() => navigate(APP_ROUTE_PATHS.profile)}
        onNavigateSeller={(sellerId, fromPath) =>
          navigate(APP_ROUTE_BUILDERS.sellerProfile(sellerId), {
            state: {
              fromPath: fromPath || APP_ROUTE_PATHS.home,
            },
          })
        }
        onNavigateChat={(sellerId, fromPath, postTitle) =>
          navigate(APP_ROUTE_BUILDERS.chatUser(sellerId), {
            state: {
              fromPath: fromPath || APP_ROUTE_PATHS.home,
              postTitle,
            },
          })
        }
        onRequireAuth={promptLoginModal}
        onUpdatePost={postActions.updatePost}
        onUpdatePostStatus={postActions.updatePostStatus}
        onDeletePost={postActions.deletePost}
      />
    </Suspense>
  );
}

function SellerMarketplaceRouteScreen() {
  const {
    appProps,
    postActions,
    navigate,
    sharedPostRouteProps,
    sharedUserRouteProps,
  } = useMarketplaceRouteContext();

  return (
    <SellerProfilePage
      language={appProps.language}
      favoriteIds={sharedPostRouteProps.favoriteIds}
      onFavoriteToggle={sharedPostRouteProps.onFavoriteToggle}
      isAuthenticated={sharedUserRouteProps.isAuthenticated}
      currentUserId={sharedUserRouteProps.currentUserId}
      onSettingsClick={() => navigate(APP_ROUTE_PATHS.settings)}
      onEditProfileClick={() => navigate(APP_ROUTE_PATHS.profileEdit)}
      onAddPostClick={() => navigate(APP_ROUTE_PATHS.sell)}
      onDeletePost={async (postId) => {
        try {
          await postActions.deletePost(postId);
          deferredToast.success(
            appProps.language === "ar" ? "تم حذف المنشور" : "Post deleted",
          );
        } catch {
          deferredToast.error(
            appProps.language === "ar" ? "حدث خطأ أثناء الحذف" : "Error deleting post",
          );
        }
      }}
      onUpdatePost={async (updatedPost) => {
        try {
          const result = await postActions.updatePost(updatedPost) as Record<string, unknown> | undefined;
          deferredToast.success(
            appProps.language === "ar" ? "تم تحديث المنشور" : "Post updated",
          );
          if (result && typeof result.message === "string" && result.message.trim().length > 0) {
            deferredToast.error(result.message);
          }
        } catch {
          deferredToast.error(
            appProps.language === "ar" ? "حدث خطأ أثناء التحديث" : "Error updating post",
          );
        }
      }}
    />
  );
}

export const marketplacePostRoutes: MarketplaceRouteDefinition[] = [
  {
    path: APP_ROUTE_PATHS.postDetails,
    Screen: PostDetailsMarketplaceRouteScreen,
  },
  {
    path: APP_ROUTE_PATHS.sellerProfile,
    Screen: SellerMarketplaceRouteScreen,
  },
];
