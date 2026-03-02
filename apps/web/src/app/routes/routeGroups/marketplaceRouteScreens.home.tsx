import { lazy } from "react";
import { useMarketplaceRouteContext } from "./marketplaceRouteContext";
import { type MarketplaceRouteDefinition } from "./marketplaceRouteDefinitions";

const HomePage = lazy(() =>
  import("../../../pages/HomePage").then((m) => ({ default: m.HomePage })),
);

export function HomeMarketplaceRouteScreen() {
  const {
    appProps,
    routeState,
    redirectToLogin,
    navigate,
    navigateToPost,
    sharedUserRouteProps,
  } = useMarketplaceRouteContext();

  return (
    <HomePage
      language={appProps.language}
      isAuthenticated={appProps.isAuthenticated}
      t={routeState.t}
      isRTL={routeState.isRTL}
      darkMode={appProps.darkMode}
      searchQuery={appProps.activeSearchQuery}
      setSearchQuery={(query) => {
        appProps.setSearchQuery(query);
        appProps.setActiveSearchQuery(query);
      }}
      setShowLoginPrompt={(show) => show && redirectToLogin()}
      setShowSellItem={(show) => {
        if (!show) {
          return;
        }

        if (!appProps.isAuthenticated) {
          redirectToLogin();
          return;
        }

        navigate("/sell");
      }}
      setShowAllPosts={(show) => show && navigate("/posts")}
      setSelectedCategoryForPage={(categoryName) =>
        categoryName && navigate(`/category/${encodeURIComponent(categoryName)}`)
      }
      isLoadingPosts={routeState.isLoadingPostsFromRouteData}
      postsError={routeState.postsError}
      displayedPosts={routeState.displayedPosts}
      viewMode={routeState.viewMode}
      setViewMode={routeState.setViewMode}
      onPostClick={(id) => navigateToPost(id, "/")}
      favoriteIds={routeState.favoriteIds}
      toggleFavorite={routeState.toggleFavorite}
      currentUserId={sharedUserRouteProps.currentUserId}
      currentUserDisplayName={sharedUserRouteProps.currentUserDisplayName}
      currentPage={routeState.currentPage}
      totalPages={routeState.totalPages}
      isLoading={routeState.isLoading}
      goToNextPage={routeState.goToNextPage}
      goToPreviousPage={routeState.goToPreviousPage}
      getCategoryTranslation={routeState.translateCategory}
    />
  );
}

export const marketplaceHomeRoutes: MarketplaceRouteDefinition[] = [
  {
    path: "/",
    Screen: HomeMarketplaceRouteScreen,
  },
];
