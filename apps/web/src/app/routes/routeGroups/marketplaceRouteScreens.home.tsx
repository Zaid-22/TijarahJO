import { lazy } from "react";
import { useMarketplaceRouteContext } from "./marketplaceRouteContext";
import { type MarketplaceRouteDefinition } from "./marketplaceRouteDefinitions";
import { useSearch } from "../../../contexts/SearchContext";

const HomePage = lazy(() =>
  import("../../../features/home/pages/HomePage").then((m) => ({ default: m.HomePage })),
);

function HomeMarketplaceRouteScreen() {
  const {
    appProps,
    routeState,
    redirectToLogin,
    promptLoginModal,
    navigate,
    navigateToPost,
    sharedUserRouteProps,
  } = useMarketplaceRouteContext();
  const { activeSearchQuery, setSearchQuery, setActiveSearchQuery } =
    useSearch();

  return (
    <HomePage
      language={appProps.language}
      isAuthenticated={appProps.isAuthenticated}
      t={routeState.t}
      isRTL={routeState.isRTL}
      darkMode={appProps.darkMode}
      searchQuery={activeSearchQuery}
      setSearchQuery={(query: string) => {
        setSearchQuery(query);
        setActiveSearchQuery(query);
      }}
      setShowLoginPrompt={(show: boolean) => show && promptLoginModal()}
      setShowSellItem={(show: boolean) => {
        if (!show) {
          return;
        }

        if (!appProps.isAuthenticated) {
          redirectToLogin();
          return;
        }

        navigate("/sell");
      }}
      setShowAllPosts={(show: boolean) => show && navigate("/posts")}
      setSelectedCategoryForPage={(categoryName: string) =>
        categoryName &&
        navigate(`/category/${encodeURIComponent(categoryName)}`)
      }
      isLoadingPosts={routeState.isLoadingPostsFromRouteData}
      postsError={routeState.postsError}
      displayedPosts={routeState.displayedPosts}
      viewMode={routeState.viewMode}
      setViewMode={routeState.setViewMode}
      onPostClick={(id: string) => navigateToPost(id, "/")}
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
