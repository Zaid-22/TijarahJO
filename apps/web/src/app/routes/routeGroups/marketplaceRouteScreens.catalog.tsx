import { lazy } from "react";
import { CategoryRouteWrapper } from "../CategoryRouteWrapper";
import { useMarketplaceRouteContext } from "./marketplaceRouteContext";
import { type MarketplaceRouteDefinition } from "./marketplaceRouteDefinitions";
import { useSearch } from "../../../contexts/SearchContext";
import { APP_ROUTE_PATHS } from "../routeConfig";

const AllPostsPage = lazy(() =>
  import("../../../features/marketplace/pages/AllPostsPage").then((m) => ({
    default: m.AllPostsPage,
  })),
);
const SearchResultsPage = lazy(() =>
  import("../../../features/marketplace/pages/SearchResultsPage").then((m) => ({
    default: m.SearchResultsPage,
  })),
);

function AllPostsMarketplaceRouteScreen() {
  const {
    appProps,
    navigate,
    navigateToPost,
    sharedPostRouteProps,
    sharedUserRouteProps,
    promptLoginModal,
  } = useMarketplaceRouteContext();

  return (
    <AllPostsPage
      onBack={() => navigate(APP_ROUTE_PATHS.home)}
      language={appProps.language}
      posts={sharedPostRouteProps.availablePosts}
      onPostClick={(id) => navigateToPost(id, "/posts")}
      favoriteIds={sharedPostRouteProps.favoriteIds}
      onFavoriteToggle={sharedPostRouteProps.onFavoriteToggle}
      isAuthenticated={sharedUserRouteProps.isAuthenticated}
      darkMode={appProps.darkMode}
      currentUserId={sharedUserRouteProps.currentUserId}
      currentUserDisplayName={sharedUserRouteProps.currentUserDisplayName}
      onRequireAuth={promptLoginModal}
    />
  );
}

function SearchResultsMarketplaceRouteScreen() {
  const {
    appProps,
    navigate,
    navigateToPost,
    sharedPostRouteProps,
    sharedUserRouteProps,
    promptLoginModal,
  } = useMarketplaceRouteContext();
  const { activeSearchQuery, setActiveSearchQuery, setSearchQuery } =
    useSearch();

  return (
    <SearchResultsPage
      searchQuery={activeSearchQuery}
      posts={sharedPostRouteProps.availablePosts}
      onBack={() => navigate(APP_ROUTE_PATHS.home)}
      onPostClick={(id) => navigateToPost(id, "/search")}
      language={appProps.language}
      favoriteIds={sharedPostRouteProps.favoriteIds}
      onFavoriteToggle={sharedPostRouteProps.onFavoriteToggle}
      isAuthenticated={sharedUserRouteProps.isAuthenticated}
      currentUserId={sharedUserRouteProps.currentUserId}
      currentUserDisplayName={sharedUserRouteProps.currentUserDisplayName}
      onRequireAuth={promptLoginModal}
      onSearch={(newQuery) => {
        setActiveSearchQuery(newQuery);
        setSearchQuery(newQuery);
      }}
    />
  );
}

function CategoryMarketplaceRouteScreen() {
  const {
    appProps,
    navigate,
    navigateToPost,
    sharedPostRouteProps,
    sharedUserRouteProps,
    promptLoginModal,
  } = useMarketplaceRouteContext();

  return (
    <CategoryRouteWrapper
      language={appProps.language}
      isAuthenticated={sharedUserRouteProps.isAuthenticated}
      currentUserId={sharedUserRouteProps.currentUserId}
      currentUserDisplayName={sharedUserRouteProps.currentUserDisplayName}
      availablePosts={sharedPostRouteProps.availablePosts}
      favoriteIds={sharedPostRouteProps.favoriteIds}
      onFavoriteToggle={sharedPostRouteProps.onFavoriteToggle}
      onBack={() => navigate(APP_ROUTE_PATHS.home)}
      onOpenPost={(id) => navigateToPost(id, "/category")}
      onRequireAuth={promptLoginModal}
    />
  );
}

export const marketplaceCatalogRoutes: MarketplaceRouteDefinition[] = [
  {
    path: APP_ROUTE_PATHS.posts,
    Screen: AllPostsMarketplaceRouteScreen,
  },
  {
    path: APP_ROUTE_PATHS.search,
    Screen: SearchResultsMarketplaceRouteScreen,
  },
  {
    path: APP_ROUTE_PATHS.category,
    Screen: CategoryMarketplaceRouteScreen,
  },
];
