import { lazy } from "react";
import { PostDetailsRouteWrapper } from "../PostDetailsRouteWrapper";
import { useMarketplaceRouteContext } from "./marketplaceRouteContext";
import { type MarketplaceRouteDefinition } from "./marketplaceRouteDefinitions";

const SellerProfilePage = lazy(() =>
  import("../../../pages/SellerProfilePage").then((m) => ({
    default: m.SellerProfilePage,
  })),
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
  } = useMarketplaceRouteContext();

  return (
    <PostDetailsRouteWrapper
      language={appProps.language}
      availablePosts={sharedPostRouteProps.availablePosts}
      isLoadingPosts={routeState.isLoadingPostsFromRouteData}
      isAuthenticated={sharedUserRouteProps.isAuthenticated}
      userProfile={appProps.userProfile}
      favoriteIds={sharedPostRouteProps.favoriteIds}
      currentUserDisplayName={sharedUserRouteProps.currentUserDisplayName}
      onFavoriteToggle={sharedPostRouteProps.onFavoriteToggle}
      onOpenPost={(id) => navigateToPost(id, "/")}
      onNavigateHome={() => navigate("/")}
      onNavigateProfile={() => navigate("/profile")}
      onNavigateSeller={(sellerId, fromPath) =>
        navigate(`/seller/${sellerId}`, {
          state: {
            fromPath: fromPath || "/",
          },
        })
      }
      onNavigateChat={(sellerId, fromPath) =>
        navigate(`/chat/${sellerId}`, {
          state: {
            fromPath: fromPath || "/",
          },
        })
      }
      onNavigateLogin={() => navigate("/login")}
      onUpdatePost={postActions.updatePost}
      onUpdatePostStatus={postActions.updatePostStatus}
      onDeletePost={postActions.deletePost}
    />
  );
}

function SellerMarketplaceRouteScreen() {
  return <SellerProfilePage />;
}

export const marketplacePostRoutes: MarketplaceRouteDefinition[] = [
  {
    path: "/post/:id",
    Screen: PostDetailsMarketplaceRouteScreen,
  },
  {
    path: "/seller/:userId",
    Screen: SellerMarketplaceRouteScreen,
  },
];
