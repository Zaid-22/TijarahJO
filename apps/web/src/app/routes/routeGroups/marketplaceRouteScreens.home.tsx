import { lazy } from "react";
import { useMarketplaceRouteContext } from "./marketplaceRouteContext";
import { type MarketplaceRouteDefinition } from "./marketplaceRouteDefinitions";
import { useSearch } from "../../../contexts/SearchContext";
import { APP_ROUTE_BUILDERS, APP_ROUTE_PATHS } from "../routeConfig";

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

        navigate(APP_ROUTE_PATHS.sell);
      }}
      setShowAllPosts={(show: boolean) => show && navigate(APP_ROUTE_PATHS.posts)}
      setSelectedCategoryForPage={(categoryName: string) =>
        categoryName &&
        navigate(APP_ROUTE_BUILDERS.category(categoryName))
      }
      isLoadingPosts={routeState.isLoadingPostsFromRouteData}
      postsError={routeState.postsError}
      displayedPosts={routeState.displayedPosts}
      availablePosts={routeState.availablePosts}
      filteredPosts={routeState.filteredPosts}
      onPostClick={(id: string) => navigateToPost(id, "/")}
      favoriteIds={routeState.favoriteIds}
      toggleFavorite={routeState.toggleFavorite}
      currentUserId={sharedUserRouteProps.currentUserId}
      currentUserDisplayName={sharedUserRouteProps.currentUserDisplayName}
      getCategoryTranslation={routeState.translateCategory}
      onNavigate={navigate}
    />
  );
}

export const marketplaceHomeRoutes: MarketplaceRouteDefinition[] = [
  {
    path: APP_ROUTE_PATHS.home,
    Screen: HomeMarketplaceRouteScreen,
  },
];
