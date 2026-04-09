import { lazy, Suspense } from "react";
import { useMarketplaceRouteContext } from "./marketplaceRouteContext";
import { type MarketplaceRouteDefinition } from "./marketplaceRouteDefinitions";
import { useSearch } from "../../../contexts/SearchContext";
import { APP_ROUTE_PATHS } from "../routeConfig";
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
const CategoryRouteWrapper = lazy(
  lazyImportWithRetry(
    () =>
      import("../CategoryRouteWrapper").then((m) => ({
        default: m.CategoryRouteWrapper,
      })),
    "lazy-import-retry:category-route-wrapper",
  ),
);

const ComparePage = lazy(() =>
  import("../../../features/marketplace/pages/ComparePage").then((m) => ({
    default: m.default,
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
    <Suspense fallback={<LoadingState minHeightClassName="min-h-[40vh]" />}>
      <CategoryRouteWrapper
        language={appProps.language}
        isAuthenticated={sharedUserRouteProps.isAuthenticated}
        currentUserId={sharedUserRouteProps.currentUserId}
        availablePosts={sharedPostRouteProps.availablePosts}
        isLoadingPosts={sharedPostRouteProps.isLoadingPosts}
        favoriteIds={sharedPostRouteProps.favoriteIds}
        onFavoriteToggle={sharedPostRouteProps.onFavoriteToggle}
        onBack={() => navigate(APP_ROUTE_PATHS.home)}
        onOpenPost={(id) => navigateToPost(id, "/category")}
        onRequireAuth={promptLoginModal}
      />
    </Suspense>
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
    path: APP_ROUTE_PATHS.compare,
    Screen: ComparePage,
  },
  {
    path: APP_ROUTE_PATHS.category,
    Screen: CategoryMarketplaceRouteScreen,
  },
];
