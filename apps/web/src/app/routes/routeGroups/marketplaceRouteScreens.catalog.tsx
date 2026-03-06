import { lazy } from "react";
import { CategoryRouteWrapper } from "../CategoryRouteWrapper";
import { useMarketplaceRouteContext } from "./marketplaceRouteContext";
import { type MarketplaceRouteDefinition } from "./marketplaceRouteDefinitions";
import { useSearch } from "../../../contexts/SearchContext";

const AllPostsPage = lazy(() =>
  import("../../../pages/AllPostsPage").then((m) => ({
    default: m.AllPostsPage,
  })),
);
const SearchResultsPage = lazy(() =>
  import("../../../pages/SearchResultsPage").then((m) => ({
    default: m.SearchResultsPage,
  })),
);

export function AllPostsMarketplaceRouteScreen() {
  const {
    appProps,
    navigate,
    navigateToPost,
    sharedPostRouteProps,
    sharedUserRouteProps,
  } = useMarketplaceRouteContext();

  return (
    <AllPostsPage
      onBack={() => navigate("/")}
      language={appProps.language}
      posts={sharedPostRouteProps.availablePosts}
      onPostClick={(id) => navigateToPost(id, "/posts")}
      favoriteIds={sharedPostRouteProps.favoriteIds}
      onFavoriteToggle={sharedPostRouteProps.onFavoriteToggle}
      isAuthenticated={sharedUserRouteProps.isAuthenticated}
      darkMode={appProps.darkMode}
      currentUserId={sharedUserRouteProps.currentUserId}
      currentUserDisplayName={sharedUserRouteProps.currentUserDisplayName}
    />
  );
}

export function SearchResultsMarketplaceRouteScreen() {
  const {
    appProps,
    navigate,
    navigateToPost,
    sharedPostRouteProps,
    sharedUserRouteProps,
  } = useMarketplaceRouteContext();
  const { activeSearchQuery, setActiveSearchQuery, setSearchQuery } =
    useSearch();

  return (
    <SearchResultsPage
      searchQuery={activeSearchQuery}
      posts={sharedPostRouteProps.availablePosts}
      onBack={() => navigate("/")}
      onPostClick={(id) => navigateToPost(id, "/search")}
      language={appProps.language}
      favoriteIds={sharedPostRouteProps.favoriteIds}
      onFavoriteToggle={sharedPostRouteProps.onFavoriteToggle}
      isAuthenticated={sharedUserRouteProps.isAuthenticated}
      currentUserId={sharedUserRouteProps.currentUserId}
      currentUserDisplayName={sharedUserRouteProps.currentUserDisplayName}
      onSearch={(newQuery) => {
        setActiveSearchQuery(newQuery);
        setSearchQuery(newQuery);
      }}
    />
  );
}

export function CategoryMarketplaceRouteScreen() {
  const {
    appProps,
    navigate,
    navigateToPost,
    sharedPostRouteProps,
    sharedUserRouteProps,
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
      onBack={() => navigate("/")}
      onOpenPost={(id) => navigateToPost(id, "/category")}
    />
  );
}

export const marketplaceCatalogRoutes: MarketplaceRouteDefinition[] = [
  {
    path: "/posts",
    Screen: AllPostsMarketplaceRouteScreen,
  },
  {
    path: "/search",
    Screen: SearchResultsMarketplaceRouteScreen,
  },
  {
    path: "/category/:categoryName",
    Screen: CategoryMarketplaceRouteScreen,
  },
];
