import { lazy, useEffect } from "react";
import { useMarketplaceRouteContext } from "./marketplaceRouteContext";
import { type MarketplaceRouteDefinition } from "./marketplaceRouteDefinitions";
import { useSearch } from "../../../contexts/SearchContext";
import { APP_ROUTE_BUILDERS, APP_ROUTE_PATHS } from "../routeConfig";

function normalizePathname(pathname: string): string {
  const normalized = pathname.toLowerCase().replace(/\/+$/, "");
  return normalized || "/";
}

function loadHomePage() {
  return import("../../../features/home/pages/HomePage").then((m) => ({
    default: m.HomePage,
  }));
}

const shouldPreloadHomePage =
  typeof window !== "undefined" &&
  normalizePathname(window.location.pathname) === APP_ROUTE_PATHS.home;

let homePageModulePromise = shouldPreloadHomePage ? loadHomePage() : null;

const HomePage = lazy(() => {
  homePageModulePromise ??= loadHomePage();
  return homePageModulePromise;
});

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

  // Clear the search state when the home page mounts so that a previous
  // search query doesn't bleed into the home sections (Featured, Recently
  // Added, All Listings, etc.).
  useEffect(() => {
    setSearchQuery("");
    setActiveSearchQuery("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setShowCreatePost={(show: boolean) => {
        if (!show) {
          return;
        }

        if (!appProps.isAuthenticated) {
          redirectToLogin();
          return;
        }

        navigate(APP_ROUTE_PATHS.sell);
      }}
      setShowAllPosts={(show: boolean, sortBy?: string) => {
        if (!show) return;
        const path = sortBy
          ? `${APP_ROUTE_PATHS.posts}?sortBy=${sortBy}`
          : APP_ROUTE_PATHS.posts;
        navigate(path);
      }}
      setSelectedCategoryForPage={(categoryName: string) =>
        categoryName &&
        navigate(APP_ROUTE_BUILDERS.category(categoryName))
      }
      isLoadingPosts={routeState.isLoadingPostsFromRouteData}
      postsError={routeState.postsError}
      retryPosts={routeState.fetchPostsFromBackend}
      displayedPosts={routeState.displayedPosts}
      availablePosts={routeState.availablePosts}
      filteredPosts={routeState.filteredPosts}
      onPostClick={(id: string) => navigateToPost(id, "/")}
      favoriteIds={routeState.favoriteIds}
      toggleFavorite={routeState.toggleFavorite}
      currentUserId={sharedUserRouteProps.currentUserId}
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
