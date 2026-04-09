import { lazy, Suspense } from "react";
import { useMarketplaceRouteContext } from "./marketplaceRouteContext";
import { type MarketplaceRouteDefinition } from "./marketplaceRouteDefinitions";
import { APP_ROUTE_BUILDERS, APP_ROUTE_PATHS } from "../routeConfig";
import { deferredToast } from "../../../utils/toast";
import { LoadingState } from "../../../shared/ui/loading-state";

function lazyImportWithRetry<TModule>(
  load: () => Promise<TModule>,
  retryKey: string,
) {
  return async () => {
    try {
      const module = await load();
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(retryKey);
      }
      return module;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isRecoverableImportError =
        /Failed to fetch dynamically imported module|Importing a module script failed/i.test(
          message,
        );

      if (
        typeof window !== "undefined" &&
        isRecoverableImportError &&
        !window.sessionStorage.getItem(retryKey)
      ) {
        window.sessionStorage.setItem(retryKey, "1");
        window.location.reload();

        return new Promise<never>(() => {
          // Keep React.lazy pending while the page reload is in flight.
        });
      }

      throw error;
    }
  };
}

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
    <Suspense fallback={<LoadingState minHeightClassName="min-h-[40vh]" />}>
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
        onNavigateProfile={() => navigate(APP_ROUTE_PATHS.profile)}
        onNavigateSeller={(sellerId, fromPath) =>
          navigate(APP_ROUTE_BUILDERS.sellerProfile(sellerId), {
            state: {
              fromPath: fromPath || APP_ROUTE_PATHS.home,
            },
          })
        }
        onNavigateChat={(sellerId, fromPath) =>
          navigate(APP_ROUTE_BUILDERS.chatUser(sellerId), {
            state: {
              fromPath: fromPath || APP_ROUTE_PATHS.home,
            },
          })
        }
        onNavigateLogin={() => navigate(APP_ROUTE_PATHS.login)}
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
          await postActions.updatePost(updatedPost);
          deferredToast.success(
            appProps.language === "ar" ? "تم تحديث المنشور" : "Post updated",
          );
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
